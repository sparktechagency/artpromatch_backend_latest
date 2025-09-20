/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
// import { Types } from 'mongoose';
// import { AppError } from '../../utils';
// import Artist from '../Artist/artist.model';
import mongoose, { startSession } from 'mongoose';
import { AppError } from '../../utils';
import { IArtist } from '../Artist/artist.interface';
import { IAuth } from '../Auth/auth.interface';
import SecretReview from '../SecretReview/secretReview.model';
import { IService } from '../Service/service.interface';
import Booking from './booking.model';

import Stripe from 'stripe';
import config from '../../config';
import Artist from '../Artist/artist.model';
import { IClient } from '../Client/client.interface';
import Client from '../Client/client.model';
import Service from '../Service/service.model';
import { parseTimeToMinutes } from './booking.utils';
import { TBookingData } from './booking.validation';

type TReviewData = {
  bookingId: string;
  review: string;
  rating: number;
  secretReviewForAdmin: string;
};

type TSessionData = {
  sessionId?: string; 
  date: Date;
  startTime: string;
  endTime: string;
};

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {});

// create booking

const createBookingIntoDB = async (user: IAuth, payload: TBookingData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const client = await Client.findOne({ auth: user.id }, '_id').session(
      session
    );
    if (!client) throw new AppError(httpStatus.NOT_FOUND, 'client not found');

    const service = await Service.findById(payload.serviceId)
      .select('artist title description bodyLocation price')
      .session(session);
    if (!service) throw new AppError(httpStatus.NOT_FOUND, 'service not found');

    const artist = await Artist.findById(service.artist)
      .populate<{ auth: IAuth }>('auth', 'email phoneNumber fullName fcmToken')
      .session(session);
    if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');

    const existingArtistBooking = await Booking.findOne({
      artist: artist._id,
      service: service._id,
      status: 'pending',
    }).session(session);
    if (existingArtistBooking)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Artist is already booked for this service'
      );

    const existingClientPending = await Booking.findOne({
      client: client._id,
      status: 'pending',
    }).session(session);
    if (existingClientPending)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You already have a pending booking request, you cannot create another until current booking is completed or cancelled'
      );

    const bookingPayload = {
      artist: artist._id,
      client: client._id,
      service: service._id,
      clientInfo: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
      },
      artistInfo: {
        fullName: artist.auth.fullName,
        email: artist.auth.email,
        phone: artist.auth.phoneNumber,
      },
      preferredDate: {
        startDate: payload.preferredStartDate,
        endDate: payload.preferredEndDate,
      },
      serviceName: service.title,
      bodyPart: service.bodyLocation,
      price: service.price,
      paymentStatus: 'pending',
    };
    const booking = await Booking.create([bookingPayload], { session });
    if (!booking || !booking[0])
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create booking');

    // Create Stripe Checkout Session using bookingId
    const checkoutSession: any = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        payment_intent_data: {
          capture_method: 'manual',
          metadata: {
            bookingId: booking[0]._id.toString(),
            fcmToken: artist?.auth.fcmToken ?? '',
          },
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: service.title,
                description: service.description,
              },
              unit_amount: Math.round(service.price * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking[0]._id.toString(),
          userId: artist?.auth.toString(),
        },
        success_url: `${process.env.CLIENT_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/booking/cancel`,
      },
      { idempotencyKey: `booking_${booking[0]._id}` } // prevent double session
    );

    // Update booking with PaymentIntent
    booking[0].paymentIntentId = checkoutSession.payment_intent as string;
    await booking[0].save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      bookingId: booking[0]._id,
      checkoutUrl: checkoutSession.url,
    };
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      err.message || 'Booking creation failed'
    );
  }
};

// repay booking
const repayBookingIntoDb = async (user: IAuth, bookingId: string) => {
  const booking = await Booking.findById(bookingId)
    .populate<{ artist: IArtist }>('artist')
    .populate<{ service: IService }>('service');

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  const client = await Client.findOne({ auth: user.id }, '_id');
  if (!client) throw new AppError(httpStatus.NOT_FOUND, 'client not found');

  if (
    !['pending', 'failed'].includes(booking.paymentStatus) ||
    (booking.paymentStatus === 'pending' && booking.paymentIntentId)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This booking cannot be repaid');
  }

  const artist = await Artist.findById(booking.artist).populate<{
    auth: IAuth;
  }>('auth', 'fcmToken');
  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');

  const checkoutSession: any = await stripe.checkout.sessions.create(
    {
      payment_method_types: ['card'],
      mode: 'payment',

      payment_intent_data: {
          capture_method: 'manual',
        },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.service.title,
              description: booking.service.description,
            },
            unit_amount: Math.round(booking.service.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking._id.toString(),
        fcmToken: artist.auth.fcmToken ?? '',
      },
      success_url: `${process.env.CLIENT_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/booking/cancel`,
    },
    { idempotencyKey: `repay_${booking._id}` }
  );

  booking.paymentIntentId = checkoutSession.payment_intent as string;
  booking.paymentStatus = 'pending';
  await booking.save();

  return {
    bookingId: booking._id,
    checkoutUrl: checkoutSession.url,
  };
};

// get user bookings
const getUserBookings = async (
  user: IAuth,
  query: { page?: number; limit?: number; search?: string }
) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;
  // Role-based filter
  const match: Record<string, any> = {};
  let infoField = '';

  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    if (!client)
      throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
    match.client = client._id;
    infoField = 'artistInfo';
  } else if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    if (!artist)
      throw new AppError(httpStatus.NOT_FOUND, 'Artist profile not found');
    match.artist = artist._id;
    infoField = 'clientInfo';
  }

  // Add search filter
  const search = query.search?.trim();
  if (search) {
    match.$or = [
      { [`${infoField}.fullName`]: { $regex: search, $options: 'i' } },
      { [`${infoField}.email`]: { $regex: search, $options: 'i' } },
      { [`${infoField}.phone`]: { $regex: search, $options: 'i' } },
      { serviceName: { $regex: search, $options: 'i' } },
      { status: { $regex: search, $options: 'i' } },
      { paymentStatus: { $regex: search, $options: 'i' } },
    ];
  }

  // Single aggregation with facet
  const [result] = await Booking.aggregate([
    { $match: match },
    {
      $facet: {
        data: [
          {
            $project: {
              _id: 1,
              serviceName: 1,
              price: 1,
              status: 1,
              paymentStatus: 1,
              name: `$${infoField}.fullName`,
              email: `$${infoField}.email`,
              phone: `$${infoField}.phone`,
              createdAt: 1,
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ]);

  const total = result.meta[0]?.total || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result.data,
  };
};

// get booking details
export const getUserBookingDetails = async (user: IAuth, bookingId: string) => {
  // Step 1: Fetch booking
  const booking = await Booking.findById(bookingId)
    .populate<{ artist: IArtist }>('artist')
    .populate<{ client: IClient }>('client')
    .populate<{ service: IService }>('service');

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Step 2: Ensure user is either the client or artist of this booking
  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
    }
    if (booking.client.toString() !== client._id.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Not authorized to view this booking'
      );
    }
  } else if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    if (!artist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Artist profile not found');
    }
    if (booking.artist.toString() !== artist._id.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Not authorized to view this booking'
      );
    }
  }

  // Step 3: Return clean response
  return {
    id: booking._id,
    service: {
      id: booking.service?._id,
      name: booking.service?.title,
      description: booking.service?.description,
      sessionType: booking.service?.sessionType,
      price: booking.service?.price,
    },
    artist: {
      id: booking.artist?._id,
      name: booking.artistInfo?.fullName,
      email: booking.artistInfo?.email,
    },
    client: {
      id: booking.client?._id,
      name: booking.clientInfo?.fullName,
      email: booking.clientInfo?.email,
    },
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    sessions: booking.sessions,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
};

const createSessionIntoDB = async (
  bookingId: string,
  payload: TSessionData
) => {
  const { date, startTime, endTime } = payload;

  console.log(date, startTime, endTime);

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'Booking not found');

  if (booking.status === 'cancelled') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot add session to cancelled booking'
    );
  }
  // Convert human times → minutes

  const startTimeInMin = parseTimeToMinutes(startTime);
  const endTimeInMin = parseTimeToMinutes(endTime);
  const duration = endTimeInMin - startTimeInMin;

  if (duration <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid session duration');
  }

  // Check overlap inside this booking (array of sessions)
  const selfOverlap = booking.sessions.find(
    (s) =>
      s.startTimeInMin != null &&
      s.endTimeInMin != null &&
      new Date(s.date).toDateString() === new Date(date).toDateString() &&
      s.startTimeInMin < endTimeInMin &&
      s.endTimeInMin > startTimeInMin
  );

  if (selfOverlap) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This booking already has a session during this time'
    );
  }

  // Check overlap with other confirmed bookings of this artist
  const overlappingBooking = await Booking.findOne({
    _id: { $ne: booking._id },
    artist: booking.artist,
    status: 'confirmed',
    sessions: {
      $elemMatch: {
        date: date,
        startTimeInMin: { $lt: endTimeInMin },
        endTimeInMin: { $gt: startTimeInMin },
      },
    },
  });

  if (overlappingBooking) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already has another booking session during this time'
    );
  }

  // Add session
  booking.sessions.push({
    sessionNumber: booking.sessions.length + 1,
    startTimeInMin,
    endTimeInMin,
    startTime,
    endTime,
    date,
    status: 'scheduled',
  });

  booking.scheduledDurationInMin =
    (booking.scheduledDurationInMin || 0) + duration;
  if (booking.status === 'ready_for_completion') {
    booking.status = 'in_progress';
  }

  await booking.save();

  return booking.sessions;
};

const getArtistSessions = async (bookingId: string, payload: TSessionData) => {
  const { date, startTime, endTime } = payload;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'Booking not found');

  if (booking.status === 'confirmed' || booking.status === 'cancelled') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Sessions can only be added to confirmed bookings'
    );
  }

  // Convert human times → minutes
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startTimeInMin = sh * 60 + sm;
  const endTimeInMin = eh * 60 + em;
  const duration = endTimeInMin - startTimeInMin;

  if (duration <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid session duration');
  }

  // Check overlap inside this booking (array of sessions)
  const selfOverlap = booking.sessions.find(
    (s) =>
      s.startTimeInMin != null &&
      s.endTimeInMin != null &&
      new Date(s.date).toDateString() === new Date(date).toDateString() &&
      s.startTimeInMin < endTimeInMin &&
      s.endTimeInMin > startTimeInMin
  );

  if (selfOverlap) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This booking already has a session during this time'
    );
  }

  // Check overlap with other confirmed bookings of this artist
  const overlappingBooking = await Booking.findOne({
    _id: { $ne: booking._id },
    artist: booking.artist,
    status: 'confirmed',
    sessions: {
      $elemMatch: {
        date: date,
        startTimeInMin: { $lt: endTimeInMin },
        endTimeInMin: { $gt: startTimeInMin },
      },
    },
  });

  if (overlappingBooking) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Artist already has another booking session during this time'
    );
  }

  // Add session
  booking.sessions.push({
    sessionNumber: booking.sessions.length + 1,
    startTimeInMin,
    endTimeInMin,
    startTime,
    endTime,
    date,
    status: 'scheduled',
  });

  booking.scheduledDurationInMin += duration;
  await booking.save();

  return booking;
};

// ReviewAfterAServiceIsCompletedIntoDB
const ReviewAfterAServiceIsCompletedIntoDB = async (
  payload: TReviewData,
  clientData: IAuth
) => {
  const { bookingId, review, rating, secretReviewForAdmin } = payload;

  const booking = await Booking.findOne({
    _id: bookingId,
    client: clientData.id,
  }).populate(['Artist', 'Client', 'Service']);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // console.log({
  //   payload,
  //   user: clientData,
  // });

  // Start a MongoDB session for transaction
  const session = await startSession();

  try {
    session.startTransaction();

    // artist avgRating & totalReviewCount
    const artist = booking.artist as unknown as IArtist;

    artist.avgRating =
      (artist.avgRating * artist.totalReviewCount + rating) /
      (artist.totalReviewCount + 1);

    artist.totalReviewCount = artist.totalReviewCount + 1;
    artist.save({ session });

    // service avgRating & totalReviewCount
    const service = booking.service as unknown as IService;
    service.avgRating =
      (service.avgRating * service.totalReviewCount + rating) /
      (service.totalReviewCount + 1);
    service.totalReviewCount = service.totalReviewCount + 1;
    service.save({ session });

    // booking review & rating
    booking.review = review;
    booking.rating = rating;
    booking.save({ session });

    const secretReview = await SecretReview.create(
      [
        {
          service: service._id,
          booking: booking._id,
          description: secretReviewForAdmin,
        },
      ],
      { session }
    );

    if (!secretReview) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to submit your review!'
      );
    }

    await session.commitTransaction();
    await session.endSession();

    return secretReview;
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();

    throw err;
  }
};

// confirm booking
const confirmBookingByArtist = async (bookingId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

    if (!booking.paymentIntentId) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'No payment found for this booking'
      );
    }

    if (booking.status !== 'pending') {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking cannot be confirmed');
    }

    if (booking.sessions.length === 0) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Cannot confirm booking without at least one session'
      );
    }

    // Capture Stripe payment
    await stripe.paymentIntents.capture(booking.paymentIntentId);

    // Update booking in DB (tentatively)
    booking.status = 'confirmed';
    booking.paymentStatus = 'captured';

    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();

    // TODO: notify client about confirmed booking

    return {
      status:booking.status,
      paymentStatus: booking.paymentStatus,
      sessions: booking.sessions
    };

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// complete session
const completeSession = async (bookingId: string, sessionId: string) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  if (booking.status === 'pending') {
    throw new AppError(httpStatus.NOT_FOUND, 'booking is now pending state');
  }

  const session = booking.sessions.find(
    (s: any) => s._id.toString() === sessionId
  );
  if (!session) throw new AppError(httpStatus.NOT_FOUND, 'Session not found');

  if (session.status !== 'scheduled') {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Session already completed or not schedulable'
    );
  }

  session.status = 'completed';
  booking.status = 'in_progress';
  await booking.save();

  const allDone = booking.sessions.every((s: any) => s.status === 'completed');
  if (allDone) {
    booking.status = 'ready_for_completion';
    await booking.save();
  }

  return booking;
};

// Artist marks completed into db
// const artistMarksCompletedIntoDb = async (user: IAuth, bookingId: string) => {
//   const artist = await Artist.findOne({ auth: user.id });
//   if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');
//   const booking = await Booking.findById(bookingId);
//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   if (booking.artist !== artist._id)
//     throw new AppError(
//       httpStatus.UNAUTHORIZED,
//       'This Artist not found in this booking'
//     );

//   // Mark artist intent

//   // Generate OTP
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   booking.otp = otp;
//   booking.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // valid 10 min
//   booking.otpVerified = false;

//   await booking.save();

//   // Send OTP to client
//   sendOtpToClient(booking.client, otp); // SMS/email/app
// };

// cancel booking
const cancelBookingIntoDb = async (
  bookingId: string,
  cancelBy: 'ARTIST' | 'CLIENT'
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session).populate('service artist');
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

    if (booking.status === 'cancelled') {
      throw new AppError(httpStatus.BAD_REQUEST, 'Booking already cancelled');
    }

    if (!booking.paymentIntentId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'No payment intent found for this booking');
    }

    // --- Stripe Refund ---
    if (booking.paymentStatus === 'authorized') {
      await stripe.paymentIntents.cancel(booking.paymentIntentId);
    } 
    else if (booking.paymentStatus === 'captured') {
      if (cancelBy === 'CLIENT') {
        throw new AppError(httpStatus.BAD_REQUEST, 'Client cannot cancel this booking! if you need cancel this book pleas contact artist');
      }

      const refundAmount = (booking.price - booking.stripeFee) * 100;
      if (refundAmount > 0) {
        await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
          amount: refundAmount,
        });
      }
    } 
    else {
      throw new AppError(httpStatus.BAD_REQUEST, `Cannot cancel booking in status: ${booking.paymentStatus}`);
    }

    // --- DB Updates ---
    booking.paymentStatus = 'refunded';
    booking.cancelledAt = new Date();
    booking.cancelBy = cancelBy;
    booking.status = 'cancelled';
    booking.artistEarning = 0;
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // Let upper layer handle rollback notification/logging
  }
};


// const completeBookingIntoDb = async (
//   bookingId: string,
//   artistId: string,
//   otpInput: string
// ) => {
//   const booking = await Booking.findById(bookingId);
//   if (!booking) throw new Error('Booking not found');
//   if (booking.artist !== artistId) throw new Error('Not authorized');

//   if (!booking.sessionCompletedByArtist)
//     throw new Error('Artist has not marked session complete');

//   if (!booking.otp || booking.otp !== otpInput) throw new Error('Invalid OTP');

//   if (booking.otpExpiresAt! < new Date()) throw new Error('OTP expired');

//   // OTP verified
//   booking.otpVerified = true;
//   booking.status = 'completed';
//   booking.completedAt = new Date();

//   // --- Stripe Payment & Transfer ---
//   const paymentIntent = await stripe.paymentIntents.capture(
//     booking.paymentIntentId!
//   );

//   const charge = await stripe.charges.retrieve(
//     paymentIntent.latest_charge as string
//   );
//   const balanceTx = await stripe.balanceTransactions.retrieve(
//     charge.balance_transaction as string
//   );
//   const stripeFee = balanceTx.fee;

//   const adminPercent = booking.service.adminCommissionPercent ?? 5;
//   const adminFee = Math.round(
//     paymentIntent.amount_received * (adminPercent / 100)
//   );
//   const artistAmount = paymentIntent.amount_received - adminFee - stripeFee;

//   const transfer = await stripe.transfers.create({
//     amount: artistAmount,
//     currency: paymentIntent.currency,
//     destination: booking.artistStripeAccountId!,
//     source_transaction: paymentIntent.latest_charge!,
//   });

//   booking.stripeFee = stripeFee;
//   booking.adminEarning = adminFee;
//   booking.artistEarning = artistAmount;
//   booking.transferId = transfer.id;

//   await booking.save();

//   return booking;
// };

export const BookingService = {
  createBookingIntoDB,
  repayBookingIntoDb,
  cancelBookingIntoDb,
  getArtistSessions,
  // completeBookingIntoDb,
  completeSession,
  // artistMarksCompletedIntoDb,
  getUserBookings,
  ReviewAfterAServiceIsCompletedIntoDB,
  createSessionIntoDB,
  confirmBookingByArtist,
};

/*
import Stripe from 'stripe';
import Booking from './models/booking.model';
import Artist from './models/artist.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function completeBookingAndPayArtist(bookingId: string) {
  // 1️⃣ Get booking
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.paymentIntentId) throw new Error('Booking/payment not found');

  // 2️⃣ Capture money in platform account
  const paymentIntent = await stripe.paymentIntents.capture(booking.paymentIntentId);

  // 3️⃣ Get artist Stripe account
  const artist = await Artist.findById(booking.artist);
  if (!artist || !artist.stripeAccountId) throw new Error('Artist Stripe account not found');

  // 4️⃣ Calculate artist share (95%) and platform fee (5%)
  const platformFeePercent = 5;
  const artistAmount = Math.round(paymentIntent.amount_received * (100 - platformFeePercent) / 100);

  // 5️⃣ Transfer artist share to artist connected account
  await stripe.transfers.create({
    amount: artistAmount, // in cents
    currency: paymentIntent.currency,
    destination: artist.stripeAccountId,
    metadata: { bookingId: booking._id.toString() },
  });

  // 6️⃣ Update booking in DB
  booking.status = 'completed';
  booking.payoutStatus = 'paid';
  booking.platformFee = Math.round(paymentIntent.amount_received * platformFeePercent / 100);
  await booking.save();

  return {
    success: true,
    capturedAmount: paymentIntent.amount_received,
    artistPaid: artistAmount,
    platformFee: booking.platformFee,
  };
}



*/

/*

const confirmBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Fetch booking with service & artist info
    const booking = await Booking.findById(bookingId).populate("service artist");
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");

    if (booking.status !== "pending") {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking cannot be confirmed");
    }

    if (!booking.paymentIntentId) {
      throw new AppError(httpStatus.BAD_REQUEST, "No payment intent found for this booking");
    }

    // Capture payment (manual capture)
    const paymentIntent = await stripeClient.paymentIntents.capture(booking.paymentIntentId);

    // Calculate admin commission (5%)
    const totalAmount = paymentIntent.amount_received; // in cents
    const adminFee = Math.round(totalAmount * 0.05);   // 5%
    const artistAmount = totalAmount - adminFee;

    // Transfer to connected artist account
    const transfer = await stripeClient.transfers.create({
      amount: artistAmount,
      currency: paymentIntent.currency,
      destination: booking.artist.stripeAccountId, // artist Stripe connected account
      source_transaction: paymentIntent.id,
    });

    // Update booking
    booking.status = "confirmed";          // booking workflow
    booking.paymentStatus = "succeeded";   // payment completed
    await booking.save();

    // TODO: send notification to client about confirmed booking and upcoming sessions

    return res.status(200).json({
      message: "Booking confirmed and payment captured successfully",
      booking,
      transferId: transfer.id,
      adminFee, 
      artistAmount,
    });
  } catch (err: any) {
    console.error("Confirm booking error:", err);
    return res.status(400).json({ message: err.message });
  }
};

*/

/*

const artistMarksComplete = async (bookingId: string, artistId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.artist !== artistId) throw new Error('Not authorized');

  // Mark artist intent
  booking.sessionCompletedByArtist = true;

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  booking.otp = otp;
  booking.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // valid 10 min
  booking.otpVerified = false;

  await booking.save();

  // Send OTP to client
  sendOtpToClient(booking.client, otp); // SMS/email/app
};


import Stripe from "stripe";
import { Booking } from "../models/booking.model"; // adjust your import
import AppError from "../utils/appError"; // your custom error
import httpStatus from "http-status"; // for status codes

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export const refundBooking = async (bookingId: string) => {
  // 1️⃣ Find the booking
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");

  if (!booking.paymentIntentId)
    throw new AppError(httpStatus.BAD_REQUEST, "No payment to refund");

  // 2️⃣ Retrieve payment intent with balance transaction
  const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId, {
    expand: ["charges.data.balance_transaction"],
  });

  const charge = paymentIntent.charges.data[0];
  const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;

  // 3️⃣ Calculate refund amount (net captured amount, Stripe fee already deducted)
  const totalCaptured = paymentIntent.amount_received; // e.g., $300 → 30000 cents
  const stripeFee = balanceTx.fee; // e.g., $9 → 900 cents

  // Refund net amount to client to avoid losing money
  const refundAmount = totalCaptured - stripeFee;

  // 4️⃣ Issue refund
  await stripe.refunds.create({
    payment_intent: booking.paymentIntentId,
    amount: refundAmount,
  });

  // 5️⃣ Update booking status
  booking.paymentStatus = "refunded";
  booking.status = "canceled"; // or your business status
  await booking.save();

  return {
    bookingId: booking._id,
    refundedAmount: refundAmount / 100, // in dollars
    stripeFee: stripeFee / 100,
  };
};


------------------

const artistVerifiesOtp = async (bookingId: string, artistId: string, otpInput: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.artist !== artistId) throw new Error('Not authorized');

  if (!booking.sessionCompletedByArtist)
    throw new Error('Artist has not marked session complete');

  if (!booking.otp || booking.otp !== otpInput)
    throw new Error('Invalid OTP');

  if (booking.otpExpiresAt! < new Date())
    throw new Error('OTP expired');

  // OTP verified
  booking.otpVerified = true;
  booking.status = 'completed';
  booking.completedAt = new Date();

  // --- Stripe Payment & Transfer ---
  const paymentIntent = await stripe.paymentIntents.capture(booking.paymentIntentId!);

  const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
  const balanceTx = await stripe.balanceTransactions.retrieve(charge.balance_transaction as string);
  const stripeFee = balanceTx.fee;

  const adminPercent = booking.service.adminCommissionPercent ?? 5;
  const adminFee = Math.round(paymentIntent.amount_received * (adminPercent / 100));
  const artistAmount = paymentIntent.amount_received - adminFee - stripeFee;

  const transfer = await stripe.transfers.create({
    amount: artistAmount,
    currency: paymentIntent.currency,
    destination: booking.artistStripeAccountId!,
    source_transaction: paymentIntent.latest_charge!,
  });

  booking.stripeFee = stripeFee;
  booking.adminEarning = adminFee;
  booking.artistEarning = artistAmount;
  booking.transferId = transfer.id;

  await booking.save();

  return booking;
};
 
--------------------


*/

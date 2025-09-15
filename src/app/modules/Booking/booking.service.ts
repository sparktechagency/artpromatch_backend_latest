/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
// import { Types } from 'mongoose';
// import { AppError } from '../../utils';
// import Artist from '../Artist/artist.model';
import { startSession } from 'mongoose';
import { AppError } from '../../utils';
import { IArtist } from '../Artist/artist.interface';
import { IAuth } from '../Auth/auth.interface';
import SecretReview from '../SecretReview/secretReview.model';
import { IService } from '../Service/service.interface';
import Booking from './booking.model';

import Stripe from 'stripe';
import config from '../../config';
import Artist from '../Artist/artist.model';
import Client from '../Client/client.model';
import Service from '../Service/service.model';
import { TBookingData } from './booking.validation';

type TReviewData = {
  bookingId: string;
  review: string;
  rating: number;
  secretReviewForAdmin: string;
};

const stripe = new Stripe(config.stripe.stripe_secret_key as string,{});

const createBookingIntoDB = async (user: IAuth, payload: TBookingData) => {
  const client = await Client.findOne({ auth: user.id });
  if (!client) throw new AppError(httpStatus.NOT_FOUND, 'client not found');

  const service = await Service.findById(payload.serviceId);
  if (!service) throw new AppError(httpStatus.NOT_FOUND, 'service not found');

  const artist = await Artist.findById(service.artist);

  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');

  const existingArtistBooking = await Booking.findOne({
    artist: artist._id,
    service: service._id,
    status: 'pending',
  });

  if (existingArtistBooking) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Artist is already booked for this service'
    );
  }

  const existingClientPending = await Booking.findOne({
    client: client._id,
    status: 'pending',
  });

  if (existingClientPending) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a pending booking request'
    );
  }

   const bookingPayload = {
    artist: artist._id,
    client: client._id,
    service: service._id,
    preferredDate: {
      startDate: payload.preferredStartDate,
      endDate: payload.preferredEndDate,
    },
    serviceName: service.title,
    bodyPart: service.bodyLocation,
    price: service.price
  };

  const booking = await Booking.create(bookingPayload);

  if(!booking) throw new AppError(httpStatus.BAD_REQUEST,'failed to create booking')

  const checkoutSession: any = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    payment_intent_data: { capture_method: 'manual' },
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
      bookingId: booking._id.toString(),
      client: client._id.toString(),
      service: service._id.toString(),
    },
    success_url: `${process.env.CLIENT_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/booking/cancel`,
  } as Stripe.Checkout.SessionCreateParams);

 
  console.log(checkoutSession.url)
  return {
    bookingId: booking._id,
    checkoutUrl: checkoutSession.url,
  };
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

// getAvailabilityFromDB
// const getAvailabilityFromDB = async (artistId: string, serviceId: string, date: Date,) => {
//   console.log(serviceId)
//   const service = await Service.findById(serviceId).lean();
//   if (!service) throw new AppError(httpStatus.NOT_FOUND, 'service not found');
//   const parsedDate = new Date(date);
//   const duration = service.durationInMinutes;
//   const buffer = service.bufferTimeInMinutes;
//   const totalTime = duration + buffer;

//   // Resolve schedule (guestSpot > offDays > weeklySchedule)
//   const resolved = await resolveScheduleForDate(artistId, parsedDate);
//   const schedule = resolved.schedule;

//   if (!schedule || schedule.off || schedule.startMin == null || schedule.endMin == null) {
//     return [];
//   }

//   // If offDays covers the date → no slots
//   if (resolved.offDays?.startDate && resolved.offDays?.endDate) {
//     if (date >= resolved.offDays.startDate && date <= resolved.offDays.endDate) {
//       return [];
//     }
//   }

//   const startMin = schedule.startMin;
//   const endMin = schedule.endMin;
//   let current = roundUpMinutes(startMin, 15);

//   const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
//   const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

//   const bookings = await Booking.find({
//     artist: artistId,
//     originalDate: { $gte: dayStart, $lt: dayEnd },
//     status: { $in: ["pending", "confirmed"] },
//   }).lean();

//   const busyIntervals = bookings.map((b) => ({ start: b.startMin, end: b.endMin }));

//   const slots: { startFrom: string }[] = [];

//   while (current + duration <= endMin) {
//     const overlaps = busyIntervals.some(
//       (i) => current < i.end && current + duration > i.start
//     );

//     if (!overlaps) {
//       slots.push({ startFrom: minToTimeString(current) });
//     }

//     current += totalTime;
//   }

//   return slots;
// };

// const getAvailabilityFromDB = async (
//   artistId: string,
//   serviceId: string,
//   date: Date
// ) => {
//   const parsedDate = new Date(date);

//   // 1. Get the service
//   const service = await Service.findOne({ _id: serviceId, artist: artistId }).lean();
//   if (!service) return [];

//   const duration = service.durationInMinutes;
//   const buffer = service.bufferTimeInMinutes;
//   const totalServiceTime = duration + buffer;

//   // 2. Resolve schedule
//   const resolved = await resolveScheduleForDate(artistId, parsedDate);
//   if (!resolved || !resolved.schedule || resolved.schedule.off) return [];

//   const { startMin, endMin } = resolved.schedule;
//   if (startMin == null || endMin == null) return [];

//   // 3. Get existing bookings
//   const dayStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
//   const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

//   const bookings = await Booking.find({
//     artist: artistId,
//     originalDate: { $gte: dayStart, $lt: dayEnd },
//     status: { $in: ['confirmed', 'pending'] },
//   })
//     .sort({ startMin: 1 }) // Sort by start time
//     .lean();

//   const slots: { startFrom: string }[] = [];
//   let current = startMin;

//   for (let i = 0; i <= bookings.length; i++) {
//     const nextBooking = bookings[i];
//     const nextBookingStart = nextBooking ? nextBooking.startMin : endMin;

//     // Fit as many slots before the next booking
//     while (current + duration <= nextBookingStart) {
//       // Check offDays
//       let inOff = false;
//       if (resolved.offDays?.startDate && resolved.offDays?.endDate) {
//         const slotStartDate = new Date(parsedDate);
//         slotStartDate.setHours(0, 0, 0, 0);
//         slotStartDate.setMinutes(current);

//         const slotEndDate = new Date(parsedDate);
//         slotEndDate.setHours(0, 0, 0, 0);
//         slotEndDate.setMinutes(current + duration);

//         inOff =
//           slotStartDate >= resolved.offDays.startDate &&
//           slotEndDate <= resolved.offDays.endDate;
//       }

//       if (!inOff && current + duration <= endMin) {
//         slots.push({ startFrom: minToTimeString(current) });
//       }

//       // Move forward by total service time (duration + buffer)
//       current += totalServiceTime;
//     }

//     // Jump current to after this booking
//     if (nextBooking) {
//       current = Math.max(current, nextBooking.endMin + buffer);
//     }
//   }

//   return slots;
// };

export const BookingService = {
  createBookingIntoDB,
  // getUserBookings,
  // getArtistBookings,
  // updateBookingStatus,
  // cancelBooking,
  // checkAvailability,
  ReviewAfterAServiceIsCompletedIntoDB,
  // getAvailabilityFromDB,
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

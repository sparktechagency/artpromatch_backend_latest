/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { startSession, Types } from 'mongoose';
import Stripe from 'stripe';
import config from '../../config';
import { AppError } from '../../utils';
import sendOtpEmailForBookingCompletion from '../../utils/sendOtpEmailForBookingCompletion';
import { IArtist } from '../Artist/artist.interface';
import Artist from '../Artist/artist.model';
import { IAuth } from '../Auth/auth.interface';
import { IClient } from '../Client/client.interface';
import Client from '../Client/client.model';
import ClientPreferences from '../ClientPreferences/clientPreferences.model';
import SecretReview from '../SecretReview/secretReview.model';
import { IService } from '../Service/service.interface';
import Service from '../Service/service.model';
import Booking from './booking.model';
import { parseTimeToMinutes } from './booking.utils';
import { TBookingData } from './booking.validation';

import ArtistPreferences from '../ArtistPreferences/artistPreferences.model';
import { ROLE } from '../Auth/auth.constant';
import { NOTIFICATION_TYPE } from '../notificationModule/notification.constant';
import {
  sendNotificationByEmail,
  sendNotificationBySocket,
  sendPushNotification,
} from '../notificationModule/notification.utils';
import { BOOKING_STATUS, PAYMENT_STATUS } from './booking.constant';

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

const createPaymentIntentIntoDB = async (
  user: IAuth,
  payload: TBookingData
) => {
  const service = await Service.findById(payload.serviceId)
    .select('_id artist title description bodyLocation price')
    .populate<{ artist: IArtist }>('artist', '_id stripeAccountId');

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
  }

  const client = await Client.findOne({ auth: user._id }).select('_id');

  if (!client) {
    throw new AppError(httpStatus.BAD_REQUEST, 'client not found');
  }
  const servicePrice = Math.round(service.price * 100);
  const commissionPercent = Number(config.admin_commision) / 100;
  const platformFeeAmount = Math.round(servicePrice * commissionPercent);

  const start = new Date(payload.preferredStartDate);
  const end = new Date(payload.preferredEndDate);

  const preferredStartDateToString = start.toLocaleDateString('en-US');
  const preferredEndDateToString = end.toLocaleDateString('en-US');

  const metaPayload = {
    serviceId: service._id.toString(),
    clientId: client._id.toString(),
    preferredStartDate: preferredStartDateToString,
    preferredEndDate: preferredEndDateToString,
  };

  const paymentIntent = await stripe.paymentIntents.create({
    amount: servicePrice,
    currency: 'usd',
    capture_method: 'manual',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: platformFeeAmount,
    transfer_data: { destination: service.artist.stripeAccountId },
    metadata: metaPayload,
  });

  return {
    clientSecret: paymentIntent.client_secret,
  };
};

const getConnectedAccountDashboard = async () => {
  const result = await stripe.accounts.createLoginLink('acct_1S7vsCKGc4sMlPFV');
  const balance = await stripe.balance.retrieve({
    stripeAccount: 'acct_1S7vsCKGc4sMlPFV',
  });
  return {
    url: result.url,
    balance: balance,
  };
};

// confirm payment
const handlePaymentIntentAuthorized = async (
  pi: Stripe.PaymentIntent
): Promise<void> => {
  try {
    const metadata = pi.metadata ?? {};
    const clientId = metadata.clientId;
    const serviceId = metadata.serviceId;

    if (!clientId || !serviceId) {
      console.warn('Missing metadata', { piId: pi.id });
      return;
    }

    // Only proceed for manual capture authorization
    if (pi.status !== 'requires_capture') {
      console.warn('PI not capturable', { status: pi.status });
      return;
    }

    // Idempotency guard
    const existingBooking = await Booking.findOne({
      'payment.client.paymentIntentId': pi.id,
    });

    if (existingBooking) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Booking already exists!');
    }

    const service = await Service.findById(serviceId).select(
      '_id artist title bodyLocation price'
    );
    if (!service) {
      console.warn('Service not found', serviceId);
      return;
    }

    const artist = await Artist.findById(service.artist).populate<{
      auth: IAuth;
    }>('auth', '_id fullName email phoneNumber fcmToken');

    if (!artist) {
      console.warn('Client not found', artist);
      return;
    }
    const client = await Client.findById(clientId).populate<{ auth: IAuth }>(
      'auth',
      'fullName email phoneNumber fcmToken'
    );

    if (!client) {
      console.warn('Client not found', client);
      return;
    }

    const booking = await Booking.create({
      artist: service.artist,
      client: client?._id,
      service: service._id,
      clientInfo: {
        fullName: client?.auth?.fullName,
        email: client?.auth?.email,
        phone: client?.auth?.phoneNumber || '',
      },
      artistInfo: {
        fullName: artist?.auth?.fullName,
        email: artist?.auth?.email,
        phone: artist?.auth?.phoneNumber || '',
      },
      payment: {
        client: {
          paymentIntentId: pi.id,
          chargeId: pi.latest_charge,
        },
      },
      preferredDate: {
        startDate: metadata.preferredStartDate,
        endDate: metadata.preferredEndDate,
      },
      serviceName: service.title,
      bodyPart: service.bodyLocation,
      price: service.price,
      paymentStatus: PAYMENT_STATUS.AUTHORIZED,
    });

    const artistPref = await ArtistPreferences.findOne(
      { artistId: service.artist },
      'notificationChannels'
    );

    // Notifications
    if (artistPref?.notificationChannels.includes('app')) {
      try {
        await sendNotificationBySocket({
          title: 'New Booking Request',
          message: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
          receiver: artist.auth._id,
          type: NOTIFICATION_TYPE.BOOKING_REQUEST,
        });
      } catch (err) {
        console.error('Failed to send app notification', err);
      }
    }

    if (artistPref?.notificationChannels.includes('email')) {
      try {
        await sendNotificationByEmail(
          booking.artistInfo.email,
          NOTIFICATION_TYPE.BOOKING_REQUEST,
          {
            fullName: booking.clientInfo.fullName,
            serviceName: booking.serviceName,
          }
        );
        console.info('Email notification sent');
      } catch {
        console.error('Failed to send email notification');
      }
    }

    if (
      artistPref?.notificationChannels.includes('sms') &&
      client?.auth.fcmToken
    ) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        await sendPushNotification(client?.auth.fcmToken, {
          title: 'New Booking Request',
          content: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
          time: formattedDate,
        });
        console.info('Push notification sent');
      } catch {
        console.error('Failed to send push notification');
      }
    }
  } catch (err) {
    console.error('Webhook logic failed', err);
  }
};

const getClientBookings = async (
  user: IAuth,
  query: { page?: number; limit?: number; search?: string }
) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  // 1. Find the Client Profile associated with this User
  const client = await Client.findOne({ auth: user._id });
  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
  }

  // 2. Initial Match: Get bookings for this specific client
  const pipeline: any[] = [
    { $match: { client: client._id } },

    {
      $lookup: {
        from: 'artists',
        localField: 'artist',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              auth: 1,
            },
          },
        ],
        as: 'artistDetails',
      },
    },
    { $unwind: { path: '$artistDetails', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'auths',
        localField: 'artistDetails.auth',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              phoneNumber: 1,
              image: 1,
            },
          },
        ],
        as: 'artistAuth',
      },
    },
    { $unwind: { path: '$artistAuth', preserveNullAndEmptyArrays: true } },
  ];

  const search = query.search?.trim();
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'artistAuth.fullName': { $regex: search, $options: 'i' } }, // Search Artist Name
          { 'artistAuth.email': { $regex: search, $options: 'i' } },
          { 'artistAuth.phone': { $regex: search, $options: 'i' } },
          { 'serviceDetails.title': { $regex: search, $options: 'i' } }, // Assuming service has a name field
          { serviceName: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
          { paymentStatus: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  // 7. Facet for Pagination & Projection
  pipeline.push({
    $facet: {
      data: [
        {
          $project: {
            _id: 1,
            serviceName: 1,
            bodyPart: 1,
            price: 1,
            preferredDate: 1,
            status: 1,
            paymentStatus: 1,
            sessions: {
              $map: {
                input: '$sessions',
                as: 'session',
                in: {
                  sessionNumber: '$$session.sessionNumber',
                  startTime: '$$session.startTime',
                  endTime: '$$session.endTime',
                  date: '$$session.date',
                  status: '$$session.status',
                },
              },
            },
            createdAt: 1,
            // Project the Artist info as the "other party"
            authId: '$artistAuth._id',
            artistName: '$artistAuth.fullName',
            artistEmail: '$artistAuth.email',
            artistPhone: '$artistAuth.phoneNumber',
            artistImage: '$artistAuth.image',
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ],
      meta: [{ $count: 'total' }],
    },
  });

  const [result] = await Booking.aggregate(pipeline);
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

const getArtistBookings = async (
  user: IAuth,
  query: { page?: number; limit?: number; search?: string }
) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  // 1. Find the Artist Profile associated with this User
  const artist = await Artist.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist profile not found');
  }

  // 2. Initial Match: Get bookings for this specific artist
  const pipeline: any[] = [
    { $match: { artist: artist._id } },

    // 4. Lookup Client (The person who booked)
    {
      $lookup: {
        from: 'clients',
        localField: 'client',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              auth: 1,
            },
          },
        ],
        as: 'clientDetails',
      },
    },
    { $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'auths',
        localField: 'clientDetails.auth',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              phoneNumber: 1,
              image: 1,
            },
          },
        ],
        as: 'clientAuth',
      },
    },
    { $unwind: { path: '$clientAuth', preserveNullAndEmptyArrays: true } },
  ];

  const search = query.search?.trim();
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'clientAuth.fullName': { $regex: search, $options: 'i' } }, // Search Client Name
          { 'clientAuth.email': { $regex: search, $options: 'i' } },
          { 'clientAuth.phoneNumber': { $regex: search, $options: 'i' } },
          { serviceName: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
          { paymentStatus: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  // 7. Facet for Pagination & Projection
  pipeline.push({
    $facet: {
      data: [
        {
          $project: {
            _id: 1,
            authId: '$clientAuth._id',
            clientName: '$clientAuth.fullName',
            clientEmail: '$clientAuth.email',
            clientPhone: '$clientAuth.phoneNumber',
            clientImage: '$clientAuth.image',
            serviceName: 1,
            bodyPart: 1,
            price: 1,
            preferredDate: 1,
            status: 1,
            paymentStatus: 1,
            sessions: {
              $map: {
                input: '$sessions',
                as: 'session',
                in: {
                  sessionNumber: '$$session.sessionNumber',
                  startTime: '$$session.startTime',
                  endTime: '$$session.endTime',
                  date: '$$session.date',
                  status: '$$session.status',
                },
              },
            },
            createdAt: 1,
            // Project the Client info as the "other party"
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ],
      meta: [{ $count: 'total' }],
    },
  });

  const [result] = await Booking.aggregate(pipeline);
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
  if (user.role === ROLE.CLIENT) {
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
  } else if (user.role === ROLE.ARTIST) {
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

// create Or update Session
const createOrUpdateSessionIntoDB = async (
  bookingId: string,
  payload: TSessionData
) => {
  const { sessionId, date, startTime, endTime } = payload;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found!');
  }

  if (['pending', 'failed'].includes(booking.paymentStatus)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment not found or failed!');
  }

  if (booking.status === 'cancelled') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot modify session in a cancelled booking!'
    );
  }

  const startTimeInMin = parseTimeToMinutes(startTime);
  const endTimeInMin = parseTimeToMinutes(endTime);
  const duration = endTimeInMin - startTimeInMin;
  if (duration <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid session duration!');
  }

  // EDIT mode
  if (sessionId) {
    const session = booking.sessions.find(
      (s) => s._id?.toString() === sessionId
    );

    if (!session) {
      throw new AppError(httpStatus.NOT_FOUND, 'Session not found!');
    }

    // update fields
    session.date = date;
    session.startTime = startTime;
    session.endTime = endTime;
    session.startTimeInMin = startTimeInMin;
    session.endTimeInMin = endTimeInMin;
    session.status = 'rescheduled'; // reset to scheduled after edit
  }
  // CREATE mode
  else {
    // Check overlap inside this booking
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

    // Check overlap with other confirmed or in-progress bookings
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      artist: booking.artist,
      status: { $in: ['confirmed', 'in_progress'] },
      sessions: {
        $elemMatch: {
          date,
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

    if (booking.sessions.length > 0) {
      const lastSession = booking.sessions[booking.sessions.length - 1];

      const lastDate = new Date(lastSession.date);
      const newDate = new Date(date);

      // If same date, compare time
      if (
        newDate < lastDate ||
        (newDate.toDateString() === lastDate.toDateString() &&
          startTimeInMin <= (lastSession.endTimeInMin ?? 0))
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'New session must be scheduled after the previous session'
        );
      }
    }

    booking.sessions.push({
      sessionNumber: booking.sessions.length + 1,
      startTimeInMin,
      endTimeInMin,
      startTime,
      endTime,
      date,
      status: 'scheduled',
    });
  }

  // Recalculate total scheduled minutes
  booking.scheduledDurationInMin = booking.sessions.reduce(
    (sum, s) =>
      sum +
      (s.startTimeInMin && s.endTimeInMin
        ? s.endTimeInMin - s.startTimeInMin
        : 0),
    0
  );

  // Recalculate booking status
  const allCompleted =
    booking.sessions.length > 0 &&
    booking.sessions.every((s) => s.status === 'completed');

  const anyCompleted = booking.sessions.some((s) => s.status === 'completed');

  if (allCompleted) {
    booking.status = 'ready_for_completion';
  } else if (anyCompleted) {
    booking.status = 'in_progress';
  }

  await booking.save();
  return booking.sessions;
};

// delete session
const deleteSessionFromBooking = async (
  bookingId: string,
  sessionId: string
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  if (booking.status === 'cancelled') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot delete session from a cancelled booking'
    );
  }

  // Find session
  const sessionIndex = booking.sessions.findIndex(
    (s) => s._id?.toString() === sessionId
  );
  if (sessionIndex === -1)
    throw new AppError(httpStatus.NOT_FOUND, 'Session not found');

  const session = booking.sessions[sessionIndex];
  if (session.status === 'completed') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot delete a completed session'
    );
  }

  // Remove session
  booking.sessions.splice(sessionIndex, 1);

  // Recalculate scheduledDurationInMin
  booking.scheduledDurationInMin = booking.sessions.reduce(
    (sum, s) =>
      sum +
      (s.startTimeInMin && s.endTimeInMin
        ? s.endTimeInMin - s.startTimeInMin
        : 0),
    0
  );

  // Recalculate booking status
  const allCompleted =
    booking.sessions.length > 0 &&
    booking.sessions.every((s) => s.status === 'completed');

  const anyCompleted = booking.sessions.some((s) => s.status === 'completed');

  if (allCompleted) {
    booking.status = 'ready_for_completion';
  } else if (anyCompleted) {
    booking.status = 'in_progress';
  }

  await booking.save();
  return booking.sessions;
};

// get Artist schdule
const getArtistDailySchedule = async (user: IAuth, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const artist = await Artist.findOne({ auth: user.id }, '_id');
  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');
  const result = await Booking.aggregate([
    // 1. Filter only artist’s bookings in valid status within the day
    {
      $match: {
        artist: new Types.ObjectId(artist._id),
        status: { $in: ['confirmed', 'in_progress', 'ready_for_completion'] },
        'sessions.date': { $gte: startOfDay, $lte: endOfDay },
      },
    },

    // 2. Only keep fields we need
    {
      $project: {
        _id: 1,
        clientInfo: { fullName: 1, phone: 1, email: 1 },
        service: 1,
        sessions: 1,
      },
    },

    // 3. Unwind sessions
    { $unwind: { path: '$sessions', preserveNullAndEmptyArrays: true } },

    // 4. Match sessions for the given day
    {
      $match: {
        'sessions.date': { $gte: startOfDay, $lte: endOfDay },
      },
    },

    // 5. Lookup service details
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        pipeline: [{ $project: { _id: 1, title: 1 } }],
        as: 'service',
      },
    },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

    // 6. Final projection
    {
      $project: {
        bookingId: '$_id',
        sessionId: '$sessions._id',
        date: '$sessions.date',
        startTime: '$sessions.startTime',
        endTime: '$sessions.endTime',
        status: '$sessions.status',
        service: { _id: '$service._id', name: '$service.title' },
        client: '$clientInfo',
      },
    },

    // 7. Sort by startTime
    { $sort: { startTime: 1 } },
  ]);

  return result;
};

// reviewAfterAServiceIsCompletedIntoDB
const reviewAfterAServiceIsCompletedIntoDB = async (
  payload: TReviewData,
  userData: IAuth
) => {
  const { bookingId, review, rating, secretReviewForAdmin } = payload;

  const client = await Client.findOne({
    auth: userData._id,
  });

  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your Client account not found!');
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    client: client._id,
  }).populate(['artist', 'client', 'service']);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found!');
  }

  const secretReview = await SecretReview.findOne({
    service: booking.service._id,
    booking: booking._id,
  });

  if (secretReview) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Review already posted!');
  }

  // Start a MongoDB session for transaction
  const session = await startSession();
  session.startTransaction();

  try {
    // artist avgRating & totalReviewCount
    const artist = booking.artist as unknown as IArtist;

    artist.avgRating =
      (artist.avgRating * artist.totalReviewCount + rating) /
      (artist.totalReviewCount + 1);

    artist.totalReviewCount = artist.totalReviewCount + 1;
    await artist.save({ session });

    // service avgRating & totalReviewCount
    const service = booking.service as unknown as IService;
    service.avgRating =
      (service.avgRating * service.totalReviewCount + rating) /
      (service.totalReviewCount + 1);
    service.totalReviewCount = service.totalReviewCount + 1;
    await service.save({ session });

    // booking review & rating
    booking.review = review;
    booking.rating = rating;
    await booking.save({ session });

    const newReview = await SecretReview.create(
      [
        {
          service: service._id,
          booking: booking._id,
          description: secretReviewForAdmin,
        },
      ],
      { session }
    );

    if (!newReview) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to submit your review!'
      );
    }

    await session.commitTransaction();
    await session.endSession();

    return newReview;
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();

    throw err;
  }
};

// confirm booking
const confirmBookingByArtist = async (bookingId: string) => {
  // 1. Find booking first
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found!');

  if (!booking.payment.client.paymentIntentId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No payment found for this booking!'
    );
  }

  if (booking.status !== 'pending') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Booking cannot be confirmed!');
  }

  if (booking.sessions.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot confirm booking without at least one session!'
    );
  }

  // 3. Atomically update booking
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'pending' },
    {
      $set: {
        status: BOOKING_STATUS.CONFIRMED,
      },
    },
    { new: true }
  );

  if (!updatedBooking) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Booking is not updated');
  }

  const client = await ClientPreferences.findOne(
    { clientId: booking.client },
    'notificationChannels'
  );

  const user = await Client.findOne({ _id: booking.client }, 'auth');
  if (!user?.auth) {
    throw new Error('User auth not found');
  }

  if (client?.notificationChannels.includes('app')) {
    sendNotificationBySocket({
      title: 'Confirmed Booking',
      message: `your booking is now confirmed by ${booking.artistInfo.fullName} for ${booking.serviceName}.`,
      receiver: user?.auth,
      type: NOTIFICATION_TYPE.CONFIRMED_BOOKING,
    });
  }

  if (client?.notificationChannels.includes('email')) {
    sendNotificationByEmail(
      booking.artistInfo.email,
      NOTIFICATION_TYPE.BOOKING_REQUEST,
      {
        fullName: booking.clientInfo.fullName,
        serviceName: booking.serviceName,
      }
    );
  }
  const date = new Date();

  const formatted = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (client?.notificationChannels.includes('sms')) {
    const clientDoc = await Client.findOne({
      _id: client.clientId,
    }).populate<{ auth: IAuth }>('auth', 'fcmToken');

    if (!clientDoc) {
      throw new AppError(httpStatus.NOT_FOUND, 'user not found');
    }

    if (clientDoc.auth?.fcmToken) {
      await sendPushNotification(clientDoc.auth.fcmToken, {
        title: 'New Booking Request',
        content: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
        time: formatted,
      });
    }
  }

  return {
    status: updatedBooking.status,
    paymentStatus: updatedBooking.paymentStatus,
    sessions: updatedBooking.sessions,
  };
};

// complete session
const completeSessionByArtist = async (
  bookingId: string,
  sessionId: string
) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  if (['pending', 'cancelled'].includes(booking.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Booking is still pending or cancelled'
    );
  }

  const session = booking.sessions.find((s) => s._id?.toString() === sessionId);
  if (!session) throw new AppError(httpStatus.NOT_FOUND, 'Session not found');

  if (!['scheduled', 'rescheduled'].includes(session.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Session already completed or not schedulable'
    );
  }

  // 🔹 Check previous sessions
  const previousSessions = booking.sessions.filter(
    (s) => s.sessionNumber < session.sessionNumber
  );

  const incompletePrev = previousSessions.some((s) => s.status !== 'completed');

  if (incompletePrev) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Previous sessions must be completed first'
    );
  }

  // Mark session completed
  session.status = 'completed';

  // Recalculate booking status
  const allDone = booking.sessions.every((s) => s.status === 'completed');
  const anyCompleted = booking.sessions.some((s) => s.status === 'completed');

  if (allDone) {
    booking.status = 'ready_for_completion';
  } else if (anyCompleted) {
    booking.status = 'in_progress';
  }

  await booking.save();
  return booking.sessions;
};

// Artist marks completed into db
const artistMarksCompletedIntoDb = async (user: IAuth, bookingId: string) => {
  const artist = await Artist.findOne({ auth: user.id });

  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');

  const booking = await Booking.findById(bookingId).populate<{
    client: IClient;
  }>('client artist status paymentStatus');

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  const client = await Client.findById(booking.client).populate<{
    auth: IAuth;
  }>('auth');

  if (!client) throw new AppError(httpStatus.NOT_FOUND, 'client not found');

  if (booking.paymentStatus !== PAYMENT_STATUS.AUTHORIZED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'payment not found');
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'booking is not ready for delivery'
    );
  }
  // Mark artist intent

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  booking.otp = otp;
  booking.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await booking.save();

  // Send OTP to client
  // await sendOtpSmsForCompleteBooking(client.auth.phoneNumber, otp);
  await sendOtpEmailForBookingCompletion(
    client.auth.email,
    otp,
    client.auth.fullName
  );
  
  return otp;
};

// resend otp booking

const resendBookingOtp = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId).populate<{
    client: IClient;
  }>('client artist status paymentStatus');
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  const client = await Client.findById(booking.client).populate<{
    auth: IAuth;
  }>('auth');

  if (!client) throw new AppError(httpStatus.NOT_FOUND, 'client not found');

  if (booking.status !== 'confirmed') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP can only be resent for confirmed bookings'
    );
  }

  // if not expired, prevent spamming
  if (booking.otpExpiresAt && booking.otpExpiresAt > new Date()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP is still valid, wait until it expires'
    );
  }

  // generate new OTP (e.g., 6-digit)
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // set expiry (e.g., 5 minutes from now)
  const expiry = new Date(Date.now() + 2 * 60 * 1000);

  booking.otp = newOtp;
  booking.otpExpiresAt = expiry;

  await booking.save();

  // TODO: integrate with SMS/email sender
  // await sendOtpEmailForBookingCompletion(
  //   client.auth.email,
  //   newOtp,
  //   client.auth.fullName
  // );

  return newOtp;
};

// cancel booking
const cancelBookingIntoDb = async (
  bookingId: string,
  cancelBy: 'ARTIST' | 'CLIENT'
) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId)
      .session(session)
      .populate('service artist payment paymentStatus');

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking not found!');
    }

    if (booking.status === 'cancelled') {
      throw new AppError(httpStatus.BAD_REQUEST, 'Booking already cancelled!');
    }

    const paymentClient = booking.payment?.client;

    if (
      booking.paymentStatus === 'pending' ||
      booking.paymentStatus === 'failed'
    ) {
      //
    } else if (booking.paymentStatus === 'authorized') {
      if (!paymentClient?.paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'No payment intent found!');
      }

      const cancelPayment = await stripe.paymentIntents.cancel(
        paymentClient.paymentIntentId
      );

      if (cancelPayment.status !== 'canceled') {
        throw new AppError(httpStatus.BAD_REQUEST, 'Payment not canceled!');
      }
    } else if (booking.paymentStatus === 'captured') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Booking already completed and payment captured; cancellation not allowed.'
      );
    } else {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot cancel booking with payment status: ${booking.paymentStatus}`
      );
    }

    // --- DB Updates ---
    booking.cancelledAt = new Date();
    booking.cancelBy = cancelBy;
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
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

// complete booking
const completeBookingIntoDb = async (
  user: IAuth,
  bookingId: string,
  otp: string
) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId)
      .select(
        'status paymentStatus payment stripeFee otpExpiresAt service client artist otp'
      )
      .populate<{ service: IService }>('service', 'totalCompletedOrder')
      .session(session);

    if (!booking)
      throw new AppError(httpStatus.BAD_REQUEST, 'Booking not found');

    if (!booking.otp)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'No OTP found for this booking'
      );
    const [artist, service] = await Promise.all([
      Artist.findOne(
        { auth: user.id },
        'stripeAccountId totalCompletedService'
      ).session(session),

      Service.findById(booking.service)
        .select('totalCompletedOrder')
        .session(session),
    ]);

    if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');

    if (!artist.stripeAccountId)
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Artist stripe account not found!'
      );

    if (!service) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');

    if (booking.status !== BOOKING_STATUS.CONFIRMED)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'this booking is not confirmed'
      );

    if (booking.paymentStatus !== PAYMENT_STATUS.AUTHORIZED)
      throw new AppError(
        httpStatus.NOT_FOUND,
        'payment is not authorized by stripe'
      );

    if (booking.otpExpiresAt && booking.otpExpiresAt < new Date()) {
      throw new AppError(httpStatus.BAD_REQUEST, 'otp time is expired');
    }

    const isOtpCorrect = await booking.isOtpMatched(otp);
    if (!isOtpCorrect) {
      throw new AppError(httpStatus.BAD_REQUEST, 'invalid otp');
    }

    const paymentIntent = await stripe.paymentIntents.capture(
      booking.payment.client.paymentIntentId as string
    );
    if (!paymentIntent)
      throw new AppError(httpStatus.NOT_FOUND, 'no payment found');
    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Payment Failed! Money Can not be tranferred'
      );
    }
    const charge = await stripe.charges.retrieve(
      paymentIntent.latest_charge as string
    );
    const balanceTx = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction as string
    );

    const stripeFee = balanceTx.fee / 100;

    const finalStripeFee = Math.round(stripeFee * 100);
    const adminPercent = Number(config.admin_commision) || 5;
    const adminFee = Math.round(
      paymentIntent.amount_received * (adminPercent / 100)
    );
    const artistAmount =
      paymentIntent.amount_received - adminFee - finalStripeFee;

    booking.set({
      status: BOOKING_STATUS.COMPLETED,
      stripeFee: Number((finalStripeFee / 100).toFixed(2)),
      platFormFee: Number((adminFee / 100).toFixed(2)),
      paymentStatus: PAYMENT_STATUS.SUCCESSED,
      completedAt: new Date(),
      artistEarning: artistAmount / 100,
      otp: undefined,
      otpExpiresAt: undefined,
    });

    artist.totalCompletedService += 1;
    service.totalCompletedOrder += 1;

    await Promise.all([
      booking.save({ session }),
      artist.save({ session }),
      service.save({ session }),
    ]);

    await session.commitTransaction();
    session.endSession();

    return {
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// getBookingsWithReviewThatHaveReviewForClientHomePage
const getBookingsWithReviewThatHaveReviewForClientHomePage = async () => {
  const bookings = await Booking.find({
    review: { $exists: true, $ne: '' },
  })
    .select('artist client review rating serviceName demoImage completedAt')
    .populate({
      path: 'client',
      select: 'auth stringLocation',
      populate: {
        path: 'auth',
        select: 'fullName image',
      },
    })
    .sort({ completedAt: -1 })
    .lean();

  return bookings;
};

export const BookingService = {
  createPaymentIntentIntoDB,
  resendBookingOtp,
  cancelBookingIntoDb,
  getArtistDailySchedule,
  getConnectedAccountDashboard,
  completeBookingIntoDb,
  completeSessionByArtist,
  deleteSessionFromBooking,
  artistMarksCompletedIntoDb,
  handlePaymentIntentAuthorized,
  getClientBookings,
  getArtistBookings,
  reviewAfterAServiceIsCompletedIntoDB,
  createOrUpdateSessionIntoDB,
  confirmBookingByArtist,
  getBookingsWithReviewThatHaveReviewForClientHomePage,
};

/*
import Stripe from 'stripe';
import Booking from './models/booking.model';
import Artist from './models/artist.model';

const stripe = new Stripe(config.stripe_secret_key, { apiVersion: '2024-06-20' });

export async function completeBookingAndPayArtist(bookingId: string) {
  // 1️⃣ Get booking
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.paymentIntentId) throw new AppError(httpStatus.NOT_FOUND,'Booking/payment not found');

  // 2️⃣ Capture money in platform account
  const paymentIntent = await stripe.paymentIntents.capture(booking.paymentIntentId);

  // 3️⃣ Get artist Stripe account
  const artist = await Artist.findById(booking.artist);
  if (!artist || !artist.stripeAccountId) throw new AppError(httpStatus.NOT_FOUND, 'Artist Stripe account not found');

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
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.artist !== artistId) throw new AppError(httpStatus.NOT_FOUND, 'Not authorized');

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

const stripe = new Stripe(config.stripe_secret_key, { apiVersion: "2022-11-15" });

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
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.artist !== artistId) throw new AppError(httpStatus.NOT_FOUND, 'Not authorized');

  if (!booking.sessionCompletedByArtist)
    throw new AppError(httpStatus.NOT_FOUND, 'Artist has not marked session complete');

  if (!booking.otp || booking.otp !== otpInput)
    throw new AppError(httpStatus.NOT_FOUND, 'Invalid OTP');

  if (booking.otpExpiresAt! < new Date())
    throw new AppError(httpStatus.NOT_FOUND, 'OTP expired');

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

/*
const createBookingIntoDB = async (user: IAuth, payload: TBookingData) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const client = await Client.findOne({ auth: user._id }, '_id').session(
      session
    );

    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client not found!');
    }

    const service = await Service.findById(payload.serviceId)
      .select('artist title description bodyLocation price')
      .session(session);

    if (!service) {
      throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
    }

    const artist = await Artist.findById(service.artist)
      .populate<{ auth: IAuth }>('auth', 'email phoneNumber fullName fcmToken')
      .session(session);

    if (!artist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
    }

    const existingArtistBooking = await Booking.findOne({
      artist: artist._id,
      service: service._id,
      status: 'pending',
    }).session(session);

    if (existingArtistBooking) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have already booked this service!'
      );
    }

    const existingClientPending = await Booking.findOne({
      client: client._id,
      status: 'pending',
    }).session(session);

    if (existingClientPending) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You already have a pending booking request, you cannot create another until current booking is completed or cancelled!'
      );
    }

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

    if (!booking || !booking[0]) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create booking!');
    }

    // Create Stripe Checkout Session using bookingId
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
                name: service.title,
                description: service.description,
              },
              unit_amount: Math.round(service.price * 100),
            },
            quantity: 1,
          },
        ],
        expand: ['payment_intent'],
        metadata: {
          bookingId: booking[0]._id.toString(),
          userId: artist?.auth?._id?.toString(),
        },
        success_url: `${config.client_url}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.client_url}/booking/cancel`,
      },
      { idempotencyKey: `booking_${booking[0]._id}` }
    );

    // Update booking with PaymentIntent
    booking[0].checkoutSessionId = checkoutSession.id;
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
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
// import { Types } from 'mongoose';
// import { AppError } from '../../utils';
// import Artist from '../Artist/artist.model';
import { startSession } from 'mongoose';
import { IAuth } from '../Auth/auth.interface';
import Booking from './booking.model';
import { AppError } from '../../utils';
import { IArtist } from '../Artist/artist.interface';
import { IService } from '../Service/service.interface';
import SecretReview from '../SecretReview/secretReview.model';
import Service from '../Service/service.model';
import {
  minToTimeString,
  resolveScheduleForDate,
  roundUpMinutes,
} from './booking.utils';
import { TBookingData } from './booking.validation';

type TReviewData = {
  bookingId: string;
  review: string;
  rating: number;
  secretReviewForAdmin: string;
};

const createBookingIntoDB = async (
  user: IAuth,
  payload: TBookingData,
) => {
  
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
const getAvailabilityFromDB = async (artistId: string, date: Date) => {
  const parsedDate: Date = new Date(date);
  const services = await Service.find({
    artist: artistId,
  }).lean();

  if (!services?.length) return [];

  const durBuf = services.map((s: IService) => ({
    id: s._id.toString(),
    duration: s.durationInMinutes,
    buffer: s.bufferTimeInMinutes,
    name: s.title,
  }));

  const minTotalServiceTime = Math.min(
    ...services.map(
      (service) => service.durationInMinutes + service.bufferTimeInMinutes
    )
  );
  const minServiceTime = Math.min(
    ...services.map((service) => service.durationInMinutes)
  );

  const resolved = await resolveScheduleForDate(artistId, parsedDate);

  if (!resolved) {
    throw new AppError(httpStatus.NOT_FOUND, 'Schedule is not Resolved!');
  }

  const schedule = resolved.schedule;

  if (
    !schedule ||
    schedule.off ||
    schedule.startMin == null ||
    schedule.endMin == null
  )
    return [];

  // Now TypeScript knows these are numbers
  const startMin = schedule.startMin;
  const endMin = schedule.endMin;

  let current = roundUpMinutes(startMin, 15);

  const dayStart = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate()
  );

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await Booking.find({
    artist: artistId,
    originalDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ['confirmed', 'pending'] },
  }).lean();

  const busyIntervals = bookings.map((b) => ({
    start: b.startMin,
    end: b.endMin,
  }));

  const slots: {
    // startMin: number;
    startFrom: string;
    // possibleServices: any[];
  }[] = [];

  while (current + minServiceTime <= endMin) {
    const fittingServices = durBuf.filter(
      (s) => current + s.duration <= endMin
    );

    if (fittingServices.length) {
      const overlaps = busyIntervals.some(
        (intervals) =>
          current < intervals.end && current + minServiceTime > intervals.start
      );

      const inOff = (resolved.offTimes || []).some((off) => {
        if (!off.startDate || !off.endDate) return false;

        const slotDt = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate()
        );

        slotDt.setMinutes(current);

        return slotDt >= off.startDate && slotDt < off.endDate;
      });

      if (!overlaps && !inOff) {
        slots.push({
          // startMin: current,
          startFrom: minToTimeString(current),
          // possibleServices: fittingServices.map((s) => ({
          //   id: s.id,
          //   name: s.name,
          //   duration: s.duration,
          // })),
        });
      }
    }

    current += minTotalServiceTime;
  }

  return slots;
};

export const BookingService = {
  createBookingIntoDB,
  // getUserBookings,
  // getArtistBookings,
  // updateBookingStatus,
  // cancelBooking,
  // checkAvailability,
  ReviewAfterAServiceIsCompletedIntoDB,
  getAvailabilityFromDB,
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
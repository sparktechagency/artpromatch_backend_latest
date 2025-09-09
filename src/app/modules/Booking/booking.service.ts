/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../utils';
import Artist from '../Artist/artist.model';
import { IAuth } from '../Auth/auth.interface';
import Slot from '../Schedule/schedule.model';
import Booking from './booking.model';
import { TBookingData } from './booking.validation';

// Create a new booking
const createBooking = async (
  user: IAuth,
  payload: TBookingData,
  file: Express.Multer.File | undefined
) => {
  const {
    slotId,
    date,
    service,
    serviceType,
    description,
    paymentIntentId,
    bodyLocation,
    transactionId,
  } = payload;
  // Check if the selected slot exists and is available
  const existSlot = await Slot.findOne({ 'slots._id': slotId });

  if (!existSlot) {
    throw new AppError(httpStatus.NOT_FOUND, 'Slot not available on this day');
  }

  const findSlot = existSlot.slots.find(
    (item) => (item._id as Types.ObjectId).toString() === slotId
  );

  if (!findSlot) {
    throw new AppError(httpStatus.NOT_FOUND, 'Slot not found!');
  }

  const artist = await Artist.findOne({ auth: existSlot.auth });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // Check if the booking already exists for the same user and artist at this slot
  const existingBooking = await Booking.findOne({
    artist: artist._id,
    user: user._id,
    date,
    slotTimeId: slotId,
  });

  if (existingBooking) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You have already booked for this time slot'
    );
  }

  let referralImage = null;

  // if referral image
  if (file) {
    referralImage = file.path;
  }

  // Create the booking
  const booking = await Booking.create({
    artist: artist._id,
    user: user._id,
    date,
    day: existSlot.day,
    paymentIntentId,
    transactionId,
    slot: existSlot._id,
    slotTimeId: findSlot._id,
    service,
    serviceType,
    bodyLocation,
    description,
    referralImage,
  });

  const result = await Booking.findById(booking._id).populate('slot');

  if (!result) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Something went wrong saving booking into DB'
    );
  }

  const { slot, slotTimeId, ...remainData } = result?.toObject() as any;

  return {
    slot: slot?.slots?.find(
      //@ts-ignore
      (item) => item._id?.toString() === slotTimeId?.toString()
    ),
    ...remainData,
  };
};

// // Get all bookings for a user (client)
// const getUserBookings = async (user: IAuth) => {
//   const bookings = await Booking.find({ user: user._id })
//     .populate('artist', 'name')
//     .populate('slot', 'start end day')
//     .exec();

//   if (!bookings.length) {
//     throw new AppError(status.NOT_FOUND, 'No bookings found for this user');
//   }

//   return bookings;
// };

// // Get all bookings for an artist
// const getArtistBookings = async (artistId: string) => {
//   const bookings = await Booking.find({ artist: artistId })
//     .populate('user', 'fullName email')
//     .populate('slot', 'start end day')
//     .exec();

//   if (!bookings.length) {
//     throw new AppError(status.NOT_FOUND, 'No bookings found for this artist');
//   }

//   return bookings;
// };

// // Update booking status (e.g., accept, reject)
// const updateBookingStatus = async (bookingId: string, status: string) => {
//   const validStatuses = Object.values(BOOKING_STATUS);
//   if (!validStatuses.includes(status)) {
//     throw new AppError(status.BAD_REQUEST, 'Invalid booking status');
//   }

//   // Find and update the booking
//   const updatedBooking = await Booking.findByIdAndUpdate(
//     bookingId,
//     { status },
//     { new: true }
//   ).populate('artist', 'name')
//     .populate('user', 'fullName')
//     .populate('slot', 'start end day')
//     .exec();

//   if (!updatedBooking) {
//     throw new AppError(status.NOT_FOUND, 'Booking not found!');
//   }

//   return updatedBooking;
// };

// // Cancel a booking
// const cancelBooking = async (bookingId: string) => {
//   const cancelledBooking = await Booking.findByIdAndUpdate(
//     bookingId,
//     { status: BOOKING_STATUS.CANCELLED },
//     { new: true }
//   ).populate('artist', 'name')
//     .populate('user', 'fullName')
//     .populate('slot', 'start end day')
//     .exec();

//   if (!cancelledBooking) {
//     throw new AppError(status.NOT_FOUND, 'Booking not found!');
//   }

//   return cancelledBooking;
// };

// // Check availability for a given date and time slot
// const checkAvailability = async (day: string, start: string, end: string) => {
//   const existingBookings = await Booking.find({
//     day,
//     'slot.start': { $lt: end },
//     'slot.end': { $gt: start },
//   });

//   if (existingBookings.length > 0) {
//     return false; // Slot is not available
//   }

//   return true; // Slot is available
// };

export const BookingService = {
  createBooking,
  // getUserBookings,
  // getArtistBookings,
  // updateBookingStatus,
  // cancelBooking,
  // checkAvailability,
};

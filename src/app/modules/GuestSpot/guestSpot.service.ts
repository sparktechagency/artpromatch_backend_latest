import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Booking from '../Booking/booking.model';
import GuestSpot from './guestSpot.model';
import { convertTimeToMinutes } from './guestSpot.utils';
import { IOffDays } from '../Schedule/schedule.interface';
import Artist from '../Artist/artist.model';

// createGuestSpotIntoDB
const createGuestSpotIntoDB = async (
  userData: IAuth,
  payload: {
    currentLocation: {
      // type: 'Point';
      coordinates: [number, number];
      currentLocationUntil: Date | null;
    };
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    offDays?: IOffDays;
  }
) => {
  const artist = await Artist.findOne({ auth: userData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist profile not found!');
  }

  const { currentLocation, startDate, endDate, startTime, endTime, offDays } =
    payload;

  const startTimeinMinute = convertTimeToMinutes(startTime);
  const endTimeinMinute = convertTimeToMinutes(endTime);

  // Check existing bookings in main location
  const existingBooking = await Booking.findOne({
    artist: artist._id,
    isInGuestSpot: false, // means main location
    originalDate: { $gte: startDate, $lte: endDate },
    // $or: [
    //   {
    startTimeinMinute: { $lt: endTimeinMinute },
    endTimeinMinute: { $gt: startTimeinMinute },
    //   },
    // ],
  });

  if (existingBooking) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have bookings in this date range at the main location!'
    );
  }

  // Check if a guest spot already exists in this date range
  const existingGuestSpot = await GuestSpot.findOne({
    artist: artist._id,
    // $or: [
    //   {
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    //   },
    // ],
  });

  if (existingGuestSpot) {
    throw new AppError(
      httpStatus.CONFLICT,
      'GuestSpot already exists for these dates!'
    );
  }

  const updatedArtist = await Artist.findOneAndUpdate(
    { auth: userData._id },
    {
      currentLocation: {
        // type: 'Point',
        coordinates: currentLocation.coordinates,
        currentLocationUntil: currentLocation.currentLocationUntil,
      },
    }
  );

  if (!updatedArtist) {
    throw new AppError(httpStatus.CONFLICT, 'Something happend wrong!');
  }

  // Create new GuestSpot
  const newGuestSpot = await GuestSpot.create({
    artist: updatedArtist._id,
    startDate,
    endDate,
    startTime,
    endTime,
    startTimeinMinute,
    endTimeinMinute,
    offDays: offDays || null,
    isActive: true,
  });

  return newGuestSpot;
};

// updateGuestSpotIntoDB
const updateGuestSpotIntoDB = async (
  userData: IAuth,
  guestSpotId: string,
  payload: {
    currentLocation: {
      // type: 'Point';
      coordinates: [number, number];
      currentLocationUntil: Date | null;
    };
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    offDays?: IOffDays;
  }
) => {
  const artist = await Artist.findOne({ auth: userData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist profile not found!');
  }

  // checking if GuestSpot is available
  const existingSpot = await GuestSpot.findOne({
    _id: guestSpotId,
    artist: artist._id,
  });

  if (!existingSpot) {
    throw new AppError(httpStatus.NOT_FOUND, 'GuestSpot not found!');
  }

  if (existingSpot.endDate < new Date()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You cant update this old GuestSpot!'
    );
  }

  const startDate = payload.startDate || existingSpot.startDate;
  const endDate = payload.endDate || existingSpot.endDate;

  const startTimeinMinute = payload.startTime
    ? convertTimeToMinutes(payload.startTime)
    : existingSpot.startTimeinMinute;

  const endTimeinMinute = payload.endTime
    ? convertTimeToMinutes(payload.endTime)
    : existingSpot.endTimeinMinute;

  // Check bookings in main location (isInGuestSpot: false)
  const bookingAtMain = await Booking.findOne({
    artist: artist._id,
    isInGuestSpot: false,
    originalDate: { $gte: startDate, $lte: endDate },
    startTimeinMinute: { $lt: endTimeinMinute },
    endTimeinMinute: { $gt: startTimeinMinute },
  });

  if (bookingAtMain) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have bookings in this date range at the main location!'
    );
  }

  // Check bookings inside guest spots (isInGuestSpot: true)
  const bookingAtGuestSpot = await Booking.findOne({
    artist: artist._id,
    isInGuestSpot: true,
    originalDate: { $gte: startDate, $lte: endDate },
    startTimeinMinute: { $lt: endTimeinMinute },
    endTimeinMinute: { $gt: startTimeinMinute },
  });

  if (bookingAtGuestSpot) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have bookings in this date range at a GuestSpot!'
    );
  }

  // Check overlap with other guest spots
  const overlappingSpot = await GuestSpot.findOne({
    _id: { $ne: guestSpotId },
    artist: artist._id,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });

  if (overlappingSpot) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Another GuestSpot already exists in this date range!'
    );
  }

  const updatedArtist = await Artist.findOneAndUpdate(
    { auth: userData._id },
    {
      currentLocation: {
        // type: 'Point',
        coordinates: payload.currentLocation.coordinates,
        currentLocationUntil: payload.currentLocation.currentLocationUntil,
      },
    },
    { new: true }
  );

  if (!updatedArtist) {
    throw new AppError(httpStatus.CONFLICT, 'Something happend wrong!');
  }

  const updatedSpot = await GuestSpot.findByIdAndUpdate(guestSpotId, payload, {
    new: true,
  });

  return updatedSpot;
};

export const GuestSpotService = {
  createGuestSpotIntoDB,
  updateGuestSpotIntoDB,
};

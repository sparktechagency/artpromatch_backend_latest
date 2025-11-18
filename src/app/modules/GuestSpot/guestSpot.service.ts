import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Booking from '../Booking/booking.model';
import GuestSpot from './guestSpot.model';
import { convertTimeToMinutes } from './guestSpot.utils';
import { IOffDays } from '../Schedule/schedule.interface';
import Artist from '../Artist/artist.model';
import { IGuestSpot } from './guestSpot.interface';

// getAllGuestSpotsFromDB
const getAllGuestSpotsFromDB = async (userData: IAuth) => {
  const artist = await Artist.findOne({ auth: userData._id })
    .select('_id currentLocation')
    .lean();

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist profile not found!');
  }

  const now = new Date();

  // Step 2: get guest spots for this artist
  const guestSpots = await GuestSpot.find({
    artist: artist._id,
    isActive: true,
    // endDate: { $gte: now },
  })
    .sort({ startDate: 1 })
    .lean();

  // Add isActive flag based on location.until > now
  const enrichedGuestSpots = guestSpots.map((spot) => {
    const until = spot.location?.until;
    const isActiveCalculated = until ? new Date(until) > now : false;

    return {
      ...spot,
      isActive: isActiveCalculated,
    };
  });

  return enrichedGuestSpots;
};

// getSingleGuestSpotFromDB
const getSingleGuestSpotFromDB = async (
  userData: IAuth,
  guestSpotId: string
) => {
  const artist = await Artist.findOne({ auth: userData._id }).select(
    '_id currentLocation'
  );
  // .lean();

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist profile not found!');
  }

  const guestSpot = await GuestSpot.findOne({
    _id: guestSpotId,
    artist: artist._id,
  });

  if (!guestSpot) {
    throw new AppError(httpStatus.NOT_FOUND, 'GuestSpot not found!');
  }

  // const isActive = guestSpot.endDate >= new Date();

  const now = new Date();
  const until = guestSpot.location?.until;
  const isActiveCalculated = until ? new Date(until) > now : false;

  return { ...guestSpot.toJSON(), isActive: isActiveCalculated };
};

// createGuestSpotIntoDB
const createGuestSpotIntoDB = async (
  userData: IAuth,
  payload: {
    currentLocation: {
      coordinates: [number, number];
      currentLocationUntil: Date | null;
    };
    stringLocation: string;
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

  const {
    currentLocation,
    stringLocation,
    startDate,
    endDate,
    startTime,
    endTime,
    offDays,
  } = payload;

  const locationUntil = currentLocation.currentLocationUntil;
  const now = new Date();

  // Validate locationUntil
  if (!locationUntil || isNaN(new Date(locationUntil).getTime())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'currentLocationUntil is required and must be a valid date.'
    );
  }

  // ensure future or present
  if (new Date(locationUntil) < now) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'currentLocationUntil has already passed!'
    );
  }

  // Validate guest spot date range fits inside locationUntil
  if (startDate > locationUntil || endDate > locationUntil) {
    throw new AppError(
      httpStatus.CONFLICT,
      'GuestSpot start and end dates must not exceed your current location period!'
    );
  }

  // Validate time
  const startTimeinMinute = convertTimeToMinutes(startTime);
  const endTimeinMinute = convertTimeToMinutes(endTime);

  if (endTimeinMinute <= startTimeinMinute) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'End time must be greater than start time'
    );
  }

  // Check existing main-location bookings that overlap this GS
  const existingBooking = await Booking.findOne({
    artist: artist._id,
    isInGuestSpot: false, // means main location
    'sessions.date': { $gte: startDate, $lte: endDate },
    'sessions.startTimeInMin': { $lt: endTimeinMinute },
    'sessions.endTimeInMin': { $gt: startTimeinMinute },
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
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });

  if (existingGuestSpot) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A GuestSpot already exists for this date range!'
    );
  }

  // Update artist location (atomic & return new doc)
  const updatedArtist = await Artist.findOneAndUpdate(
    { auth: userData._id },
    {
      currentLocation: {
        type: 'Point',
        coordinates: currentLocation.coordinates,
        currentLocationUntil: locationUntil,
      },
    },
    { new: true }
  );

  if (!updatedArtist) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Artist update failed!'
    );
  }

  // Create new GuestSpot
  const newGuestSpot = await GuestSpot.create({
    artist: updatedArtist._id,
    location: {
      coordinates: currentLocation.coordinates,
      until: locationUntil,
    },
    stringLocation,
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
    currentLocation?: {
      coordinates: [number, number];
      currentLocationUntil: Date | null;
    };
    stringLocation: string;
    startDate?: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    offDays?: IOffDays;
  }
) => {
  const artist = await Artist.findOne({ auth: userData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist profile not found!');
  }

  // Find the spot
  const existingSpot = await GuestSpot.findOne({
    _id: guestSpotId,
    artist: artist._id,
  });

  if (!existingSpot) {
    throw new AppError(httpStatus.NOT_FOUND, 'GuestSpot not found!');
  }

  // Prevent updates on expired guest spots
  if (existingSpot.endDate < new Date()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You cannot update a past GuestSpot!'
    );
  }

  // Resolve final stringLocation
  const stringLocation = payload.stringLocation ?? existingSpot.stringLocation;

  // Resolve final dates
  const startDate = payload.startDate ?? existingSpot.startDate;
  const endDate = payload.endDate ?? existingSpot.endDate;

  // Validate Dates
  if (
    isNaN(new Date(startDate).getTime()) ||
    isNaN(new Date(endDate).getTime())
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid startDate or endDate');
  }

  // Determine locationUntil based on update or existing artist
  const effectiveCurrentLocationUntil =
    payload.currentLocation?.currentLocationUntil ??
    artist.currentLocation.currentLocationUntil;

  if (!effectiveCurrentLocationUntil) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'currentLocationUntil required and must cover the updated GuestSpot range!'
    );
  }

  // Ensure updated date inside artist's available location range
  if (
    startDate > effectiveCurrentLocationUntil ||
    endDate > effectiveCurrentLocationUntil
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Updated GuestSpot dates exceed your current location availability!'
    );
  }

  // Resolve final time fields
  const startTimeinMinute = payload.startTime
    ? convertTimeToMinutes(payload.startTime)
    : existingSpot.startTimeinMinute;

  const endTimeinMinute = payload.endTime
    ? convertTimeToMinutes(payload.endTime)
    : existingSpot.endTimeinMinute;

  if (endTimeinMinute <= startTimeinMinute) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'endTime must be greater than startTime!'
    );
  }

  // Check main location bookings conflict
  const bookingAtMain = await Booking.findOne({
    artist: artist._id,
    isInGuestSpot: false,
    'sessions.date': { $gte: startDate, $lte: endDate },
    'sessions.startTimeInMin': { $lt: endTimeinMinute },
    'sessions.endTimeInMin': { $gt: startTimeinMinute },
  });

  if (bookingAtMain) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have bookings in this date range at the main location!'
    );
  }

  // Check guest-spot bookings conflict
  const bookingAtGuestSpot = await Booking.findOne({
    artist: artist._id,
    isInGuestSpot: true,
    'sessions.date': { $gte: startDate, $lte: endDate },
    'sessions.startTimeInMin': { $lt: endTimeinMinute },
    'sessions.endTimeInMin': { $gt: startTimeinMinute },
  });

  if (bookingAtGuestSpot) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have bookings within this time range at a GuestSpot!'
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

  // Update artist location if provided
  if (payload.currentLocation) {
    const updatedArtistDoc = await Artist.findOneAndUpdate(
      { auth: userData._id },
      {
        currentLocation: {
          type: 'Point',
          coordinates:
            payload.currentLocation.coordinates ??
            artist.currentLocation.coordinates,
          currentLocationUntil:
            payload.currentLocation.currentLocationUntil ??
            artist.currentLocation.currentLocationUntil,
        },
      },
      { new: true }
    );

    if (!updatedArtistDoc) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Artist update failed!'
      );
    }
  }

  // Build the safe update object (avoid unsafe overwriting)
  const updateData: Partial<IGuestSpot> = {
    location: {
      coordinates:
        payload.currentLocation?.coordinates ??
        existingSpot.location.coordinates,
      until: effectiveCurrentLocationUntil,
    },
    stringLocation,

    startDate,
    endDate,

    startTime: payload.startTime ?? existingSpot.startTime,
    endTime: payload.endTime ?? existingSpot.endTime,

    startTimeinMinute,
    endTimeinMinute,

    offDays: payload.offDays ?? existingSpot.offDays,
  };

  const updatedSpot = await GuestSpot.findByIdAndUpdate(
    guestSpotId,
    updateData,
    { new: true }
  );

  return updatedSpot;
};

export const GuestSpotService = {
  getAllGuestSpotsFromDB,
  getSingleGuestSpotFromDB,
  createGuestSpotIntoDB,
  updateGuestSpotIntoDB,
};

/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import status from 'http-status';
import moment from 'moment';
import { ObjectId } from 'mongoose';
import QueryBuilder from '../../builders/QueryBuilder';
import { TAvailability } from '../../schema/slotValidation';
import { AppError } from '../../utils';
import ArtistPreferences from '../ArtistPreferences/artistPreferences.model';
import { IAuth } from '../Auth/auth.interface';
import Auth from '../Auth/auth.model';
import Booking from '../Booking/booking.model';
import Slot from '../Slot/slot.model';
import {
  hasOverlap,
  parseSlotTime,
  removeDuplicateSlots,
  splitIntoHourlySlots,
  toMinutes,
} from '../Slot/slot.utils';
import Artist from './artist.model';
import {
  TUpdateArtistNotificationPayload,
  TUpdateArtistPayload,
  TUpdateArtistPreferencesPayload,
  TUpdateArtistPrivacySecurityPayload,
  TUpdateArtistProfilePayload,
} from './artist.validation';
import ArtistSchedule from '../Slot/slot.model';
import { IArtistSchedule } from '../Slot/slot.interface';

// update profile
const updateProfile = async (
  user: IAuth,
  payload: TUpdateArtistProfilePayload
) => {
  const artist = await Artist.findOne({ auth: user._id });

  console.log('artist', artist);
  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  const updatedArtist = await Auth.findByIdAndUpdate(user._id, payload);
  
  console.log("a",updatedArtist)
  if (!updatedArtist?.isModified) {
    throw new AppError(status.NOT_FOUND, 'Failed to update artist!');
  }

  const result = await Artist.findOne({ auth: user._id }).select('_id').populate({
    path: 'auth',
    select: 'fullName', 
  });

  return result;
};

// update preferrence
const updatePreferences = async (
  user: IAuth,
  payload: TUpdateArtistPreferencesPayload
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(status.NOT_FOUND, 'Artist preferences not found');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// update Notification preferrence
const updateNotificationPreferences = async (
  user: IAuth,
  payload: TUpdateArtistNotificationPayload
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(status.NOT_FOUND, 'Artist preferences not found');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// update privacy security
const updatePrivacySecuritySettings = async (
  user: IAuth,
  payload: TUpdateArtistPrivacySecurityPayload
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(status.NOT_FOUND, 'Artist preferences not found');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// add flashes
const addFlashesIntoDB = async (
  user: IAuth,
  files: Express.Multer.File[] | undefined
) => {
  console.log('id', user._id);
  const artist = await Artist.findOne({
    auth: user._id,
  });

  console.log('user', artist);
  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  if (!files || !files?.length) {
    throw new AppError(status.BAD_REQUEST, 'Files are required');
  }

  console.log('files', files);
  return await Artist.findByIdAndUpdate(
    artist._id,
    {
      $push: {
        flashes: { $each: files.map((file) => file.path) },
      },
    },
    { new: true }
  );
};

// add portfolio
const addPortfolioImages = async (
  user: IAuth,
  files: Express.Multer.File[] | undefined
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  // if (!artist.isVerified) {
  //   throw new AppError(status.BAD_REQUEST, 'Artist not verified');
  // }

  // if (!artist.isActive) {
  //   throw new AppError(status.BAD_REQUEST, 'Artist not activated by admin yet');
  // }

  if (!files || !files?.length) {
    throw new AppError(status.BAD_REQUEST, 'Files are required');
  }

  return await Artist.findByIdAndUpdate(
    artist._id,
    {
      $push: {
        portfolio: { $each: files.map((file) => file.path) },
      },
    },
    { new: true }
  );
};

// remove image
const removeImage = async (user: IAuth, filePath: string) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  // Remove the image file path from the 'flashes' array
  const updatedArtist = await Artist.findByIdAndUpdate(
    artist._id,
    {
      $pull: {
        flashes: filePath,
        portfolio: filePath,
      },
    },
    { new: true }
  );

  if (!updatedArtist) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to remove flash image'
    );
  }

  // Check if the file exists and delete it
  fs.unlink(filePath, () => {});

  return updatedArtist;
};

// update artist person info into db
const updateArtistPersonalInfoIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPayload
) => {
  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  await ArtistPreferences.findOneAndUpdate({ artistId: artist._id }, payload, {
    new: true,
  });

  return await Artist.findOneAndUpdate({ auth: user._id }, payload, {
    new: true,
  }).populate('preferences');
};

// save availbility into db
// const saveAvailabilityIntoDB = async (user: IAuth, payload: TAvailability) => {
//   const { day, slots } = payload;

//   // Step 1: Normalize into 1-hour blocks
//   const hourlySlots = slots.flatMap((slot) =>
//     splitIntoHourlySlots(slot.start, slot.end)
//   );

//   console.log('hourlyslots', hourlySlots);
//   // Step 2: Deduplicate within request
//   const uniqueSlots = removeDuplicateSlots(hourlySlots);

//   console.log('uniqueslots', uniqueSlots);
//   // Step 3: Fetch existing slots for that day
//   const existing = await Slot.findOne({ auth: user._id, day });

//   if (existing) {
//     const existingSlots = existing.slots;

//     // Step 4: Check overlap
//     if (hasOverlap(existingSlots, uniqueSlots)) {
//       throw new AppError(
//         status.BAD_REQUEST,
//         'New slots overlap with existing slots'
//       );
//     }

//     // Step 5: Merge, dedupe, and sort
//     const merged = removeDuplicateSlots([
//       ...existingSlots,
//       ...uniqueSlots,
//     ]).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

//     // Step 6: Save
//     existing.set('slots', merged);
//     await existing.save();
//     return existing;
//   } else {
//     // First time adding slots
//     return await Slot.create({
//       auth: user._id,
//       day,
//       slots: uniqueSlots,
//     });
//   }
// };



/* ------ */

// fetch all artist from db
const fetchAllArtistsFromDB = async (query: Record<string, unknown>) => {
  const artistsQuery = new QueryBuilder(
    Artist.find({}).populate([
      {
        path: 'auth',
        select: 'fullName image phoneNumber',
      },
      {
        path: 'portfolio.folder',
        select: 'name images createdAt',
      },
    ]),
    query
  )
    .search([])
    .fields()
    .filter()
    .paginate()
    .sort();

  const data = await artistsQuery.modelQuery;
  const meta = await artistsQuery.countTotal();

  return { data, meta };
};

//

const saveAvailabilityIntoDB = async (user: IAuth, payload: TAvailability) => {
  
  const { day, slots } = payload; 

  // Step 1: Parse incoming slots → with correct weekday
  const parsedSlots = slots.map(slot => {
    const start = parseSlotTime(day, slot.startTime);
    const end = parseSlotTime(day, slot.endTime);

    if (!(start instanceof Date) || isNaN(start.getTime()) ||
        !(end instanceof Date) || isNaN(end.getTime())) {
      throw new Error(`Invalid time format for slot: ${slot.startTime} - ${slot.endTime}`);
    }

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      startDateTime: start,
      endDateTime: end
    };
  });

  // Step 2: Fetch or create artist schedule
  let schedule:any = await ArtistSchedule.findOne({ artist: user._id });
  if (!schedule) {
    schedule = new ArtistSchedule({
      artist: user._id,
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    });
  }

  // Step 3: Conflict check against existing slots
  const existingSlots: typeof parsedSlots = schedule[day] || [];
  parsedSlots.forEach(newSlot => {
    const conflict = existingSlots.some(existing =>
      newSlot.startDateTime < existing.endDateTime &&
      newSlot.endDateTime > existing.startDateTime
    );
    if (conflict) {
      throw new Error(
        `Slot ${newSlot.startTime} - ${newSlot.endTime} overlaps with existing schedule`
      );
    }
  });

  // Step 4: Merge + sort
  schedule[day] = [...existingSlots, ...parsedSlots].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
  );

  await schedule.save();
  return schedule;
};

// For availability
const updateAvailability = async (user: IAuth, data: any) => {
  // Find the artist
  const artist = await Artist.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  // Update availability slots
  const slots = data.slots; // This would be an array of time slots
  // Assuming you store the time slots in the artist schema or in a related collection
  await Slot.updateMany(
    { auth: artist.auth },
    { $set: { slots } } // Update the slots for the artist
  );

  return artist;
};

// update time off
const updateTimeOff = async (user: IAuth, payload: { dates: string[] }) => {
  // Handle time-off (if needed, set blocked dates, etc.)
  // Assuming time off is stored as an array of dates that are blocked

  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  // Convert the string dates in the payload to Date objects
  const newDates = payload.dates.map((date) => new Date(date));

  // Validate the payload dates to ensure they are in the future
  newDates.forEach((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison

    if (today > date) {
      throw new AppError(
        status.BAD_REQUEST,
        'Selected date cannot be in the past. Please choose a future date.'
      );
    }
  });

  // Get the current date and set the time to midnight to ignore the time part
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set to midnight for correct comparison
  const currentDateString = currentDate.toISOString(); // Convert to ISO string for accurate comparison

  // Remove past dates from timeOff
  await Artist.updateOne(
    { _id: artist._id },
    {
      $pull: {
        timeOff: { $lt: currentDateString }, // Remove past dates from timeOff
      },
    }
  );

  // Add the time-off dates
  const result = await Artist.updateOne(
    { _id: artist._id },
    {
      $addToSet: {
        timeOff: { $each: newDates.map((date) => date.toISOString()) }, // Add new dates without duplicates
      },
    }
  );

  if (result.modifiedCount === 0) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to update time off'
    );
  }

  const updatedArtist = await Artist.findById(artist._id);
  return updatedArtist;
};

// get availibilty excluding time off
const getAvailabilityExcludingTimeOff = async (
  artistId: string,
  month: number,
  year: number
) => {
  const artist = await Artist.findById(artistId);

  if (!artist) {
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  // Fetch the available slots for the artist
  const availableSlots = await Slot.find({ auth: artist.auth }).select(
    'day slots'
  );

  // Fetch the artist's time off (days when they are not available)
  const offDay = artist.timeOff.map((off) => moment(off).format('YYYY-MM-DD'));

  // Get the total days for the given month and year

  const totalDays = new Date(
    new Date().getFullYear(),
    month, // this is dynamic data from frontend
    0
  ).getDate();

  // Fetch booking data for the artist for upcoming dates
  const bookingData = await Booking.find({
    artist: artist._id,
    date: { $gt: new Date() },
    status: { $ne: 'cancelled' },
  }).populate('slot');

  // Generate the calendar data by iterating through each day of the month
  const calendarData = [];

  for (let day = 1; day <= totalDays; day++) {
    const currentDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD'); // The current date in the loop
    const dayName = currentDate.format('dddd'); // Name of the day (e.g., Monday, Tuesday)

    // Check if this day is a time off day for the artist
    const isOffDay = offDay.includes(currentDate.format('YYYY-MM-DD'));

    // Get the available slots for this day
    const availableSlotsForDay =
      availableSlots.find((slot) => slot.day === dayName)?.slots || [];

    // Exclude booked slots for this day
    const availableTimeSlots = availableSlotsForDay.filter((slot) => {
      return !bookingData.some((booking) => {
        // Check if the booking is on the same day and if the slot time matches
        return (
          moment(booking.date).isSame(currentDate, 'day') &&
          booking.slotTimeId.toString() === (slot._id as ObjectId).toString()
        );
      });
    });

    // Add the data for this day to the calendar data
    calendarData.push({
      date: currentDate.format('YYYY-MM-DD'),
      dayName,
      availableSlots: isOffDay ? [] : availableTimeSlots, // If it's an off day, no available slots
      isUnavailable: isOffDay || availableTimeSlots.length === 0, // If it's an off day or no available slots, mark it as unavailable
    });
  }

  // Return the calendar data
  return { calendarData };
};

export const ArtistService = {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  updatePrivacySecuritySettings,
  addFlashesIntoDB,
  addPortfolioImages,
  removeImage,
  updateArtistPersonalInfoIntoDB,
  saveAvailabilityIntoDB,
  fetchAllArtistsFromDB,
  updateAvailability,
  updateTimeOff,
  getAvailabilityExcludingTimeOff,
};

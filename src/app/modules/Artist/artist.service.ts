/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import QueryBuilder from '../../builders/QueryBuilder';
import { TAvailability } from '../../schema/slotValidation';
import { AppError, Logger } from '../../utils';
import ArtistPreferences from '../ArtistPreferences/artistPreferences.model';
import {
  IService,
  TServiceImages,
  TServicePayload,
} from '../Service/service.interface';
import { IAuth } from '../Auth/auth.interface';
import { Auth } from '../Auth/auth.model';

import { formatDay, normalizeWeeklySchedule } from '../Schedule/schedule.utils';
import { IArtist } from './artist.interface';
import Artist from './artist.model';
import {
  TSetOffTime,
  TUpdateArtistNotificationPayload,
  TUpdateArtistPayload,
  TUpdateArtistPreferencesPayload,
  TUpdateArtistPrivacySecurityPayload,
  TUpdateArtistProfilePayload,
} from './artist.validation';

import stripe from '../Payment/payment.service';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../config';

import Service from '../Service/service.model';
import ArtistSchedule from '../Schedule/schedule.model';
import { WeeklySchedule } from '../Schedule/schedule.interface';
import Booking from '../Booking/booking.model';
import { parseDurationToMinutes } from '../Service/service.zod';
import { number } from 'zod';

// update profile
const updateProfile = async (
  user: IAuth,
  payload: TUpdateArtistProfilePayload
) => {
  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const updatedArtist = await Auth.findByIdAndUpdate(user._id, payload);

  if (!updatedArtist?.isModified) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update artist!');
  }

  const result = await Artist.findOne({ auth: user._id })
    .select('_id')
    .populate({
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
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
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
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
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
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
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
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required!');
  }

  return await Artist.findByIdAndUpdate(
    artist._id,
    {
      $push: {
        flashes: { $each: files.map((file) => file.path.replace(/\\/g, '/')) },
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
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // if (!artist.isVerifiedByOTP) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not verified');
  // }

  // if (!artist.isActive) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not activated by admin yet');
  // }

  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required');
  }

  return await Artist.findByIdAndUpdate(
    artist._id,
    {
      $push: {
        portfolio: {
          $each: files.map((file) => file.path.replace(/\\/g, '/')),
        },
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
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
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
      httpStatus.INTERNAL_SERVER_ERROR,
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
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
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
    Artist.find().populate([
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

// save availability
const saveAvailabilityIntoDB = async (user: IAuth, payload: TAvailability) => {
  const { weeklySchedule: inputSchedule } = payload;

  const artist: IArtist = await Artist.findOne({ auth: user._id }).select(
    '_id'
  );

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  let schedule = await ArtistSchedule.findOne({ artistId: artist._id });

  const normalizedSchedule = normalizeWeeklySchedule(
    inputSchedule,
    schedule?.weeklySchedule
  );

  if (schedule) {
    schedule.weeklySchedule = normalizedSchedule;
  } else {
    schedule = new ArtistSchedule({
      artistId: artist._id,
      weeklySchedule: normalizedSchedule,
    });
  }

  await schedule.save();
  const updatedSchedule: Partial<Record<keyof WeeklySchedule, any>> = {};
  for (const day of Object.keys(inputSchedule) as (keyof WeeklySchedule)[]) {
    updatedSchedule[day] = formatDay(schedule.weeklySchedule[day]);
  }

  return updatedSchedule;
};

// update time off
const setTimeOffInDb = async (user: IAuth, payload: TSetOffTime) => {
  const artist = await Artist.findOne({ auth: user._id }).select('_id');
  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');

  const { startDate, endDate } = payload;

  if (endDate <= startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'End date must be after start date'
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule = await ArtistSchedule.findOne({ _id: artist._id });
  if (!schedule)
    throw new AppError(httpStatus.NOT_FOUND, 'Artist schedule not found');

  const existing = schedule.offTime;

  /**
   * Case 1: OffTime already active (ongoing right now)
   */
  if (
    existing?.startDate &&
    existing.startDate < today &&
    existing.endDate &&
    today <= existing.endDate
  ) {
    if (endDate <= existing.endDate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'End date must extend current offTime'
      );
    }

    const hasBookings = await Booking.exists({
      artist: artist._id,
      originalDate: { $gte: existing.endDate, $lt: endDate },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (hasBookings) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Cannot extend offTime — bookings exist in new range'
      );
    }

    schedule.offTime.endDate = endDate;
    await schedule.save();
    return schedule.offTime;
  }

  /**
   * Case 2: Old offTime expired — override if no conflicts
   */
  if (existing?.endDate && existing.endDate < today) {
    const hasBookings = await Booking.exists({
      artist: artist._id,
      originalDate: { $gte: startDate, $lt: endDate },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (hasBookings) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Cannot override expired offTime — bookings exist in new period'
      );
    }

    schedule.offTime = { startDate, endDate };
    await schedule.save();
    return schedule.offTime;
  }

  /**
   * Case 3: New future offTime
   */
  if (startDate < today) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Start date cannot be in the past'
    );
  }

  const hasBookings = await Booking.exists({
    artist: artist._id,
    originalDate: { $gte: startDate, $lt: endDate },
    status: { $in: ['pending', 'confirmed'] },
  });

  if (hasBookings) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Cannot set offTime — bookings exist in this period'
    );
  }

  schedule.offTime = { startDate, endDate };
  await schedule.save();
  return schedule.offTime;
};

// create connceted account and onvoparding link for artist into db
const createConnectedAccountAndOnboardingLinkForArtistIntoDb = async (
  userData: JwtPayload
) => {
  try {
    // Step 1: Find Artist
    const artist = await Artist.findOne(
      { auth: userData._id },
      { _id: 1, stripeAccountId: 1, isStripeReady: 1, auth: 1 }
    ).populate('auth');

    if (!artist) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Artist not found or restricted.'
      );
    }

    // Step 2: If Stripe account exists but not ready yet
    if (artist.stripeAccountId && !artist.isStripeReady) {
      const account = await stripe.accounts.retrieve(artist.stripeAccountId);

      const isStripeFullyOk =
        account?.capabilities?.card_payments === 'active' &&
        account?.capabilities?.transfers === 'active';

      if (isStripeFullyOk) {
        // Mark artist as Stripe ready
        artist.isStripeReady = true;
        await artist.save();

        return null; // Already ready, no need for onboarding link
      }

      // Generate new onboarding link for existing account
      const onboardingData = await stripe.accountLinks.create({
        account: artist.stripeAccountId,
        refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${artist.stripeAccountId}`,
        return_url: config.stripe.onboarding_return_url,
        type: 'account_onboarding',
      });

      return onboardingData.url;
    }

    // Step 3: If no Stripe account, create a new one
    if (!artist.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: (artist?.auth as any)?.email,
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: { schedule: { interval: 'manual' } },
        },
      });

      const onboardingData = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${account.id}`,
        return_url: config.stripe.onboarding_return_url,
        type: 'account_onboarding',
      });

      const updatedArtist = await Artist.findByIdAndUpdate(
        artist._id,
        { $set: { stripeAccountId: account.id, isStripeReady: false } },
        { new: true }
      );

      if (!updatedArtist) {
        await stripe.accounts.del(account.id); // cleanup

        throw new AppError(
          httpStatus.NOT_EXTENDED,
          'Failed to save Stripe account ID into DB!'
        );
      }

      return onboardingData.url;
    }

    return null; // Fallback
  } catch (error) {
    Logger.error('Stripe Onboarding Error:', error);
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Stripe onboarding service unavailable'
    );
  }
};

// create service
const createService = async (
  user: IAuth,
  payload: TServicePayload,
  files: TServiceImages
): Promise<IService> => {
  const artist = await Artist.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Artist not found!');
  }
  const thumbnail = files?.thumbnail[0]?.path.replace(/\\/g, '/') || '';
  const images = files?.images?.map(
    (image) => image.path.replace(/\\/g, '/') || ''
  );
   const totalDurationInMinutes = parseDurationToMinutes(payload.totalDuration);
   const sessionInMinutes = parseDurationToMinutes(payload.sessionDuration);
   console.log({totalDurationInMinutes,sessionInMinutes})
  const numberOfSessions = Math.ceil(totalDurationInMinutes / sessionInMinutes);
  const serviceData = {
    ...payload,
    artist: artist._id,
    totalDurationInMin: totalDurationInMinutes,
    sessionDurationInMin: sessionInMinutes,
    numberOfSessions: numberOfSessions,
    thumbnail: thumbnail,
    images: images,
  };

  const service = await Service.create(serviceData);
  return service;
};

// getServicesByArtistFromDB
const getServicesByArtistFromDB = async (user: IAuth) => {
  const artist = await Artist.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');
  }

  const artistObjectId = new Types.ObjectId(artist._id);

  const result = await Service.aggregate([
    { $match: { artist: artistObjectId } },

    {
      $project: {
        _id: 1,
        title: 1,
        price: 1,
        durationInMinutes: 1,
        bufferTimeInMinutes: 1,
        thumbnail: 1,
        images: 1,
        totalCompletedOrder: 1,
        totalReviewCount: 1,
        avgRating: 1,
      },
    },
  ]);

  return result;
};

//get all services of an artist
// Update service
const updateServiceById = async (id: string, data: Partial<IService>) => {
  const serviceExists = await Service.findById(id);
  if(!serviceExists) throw new AppError(httpStatus.NOT_FOUND, 'service not found')
  const service = await Service.findByIdAndUpdate(id, data, { new: true });
  if (!service) throw new AppError(httpStatus.BAD_REQUEST, 'failed to update service');  
  return service;
};

// Delete service


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
  // updateAvailability,
  setTimeOffInDb,
  createConnectedAccountAndOnboardingLinkForArtistIntoDb,
  createService,
  getServicesByArtistFromDB,
  updateServiceById,

};

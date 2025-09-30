/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose, { startSession } from 'mongoose';
import { AppError } from '../../utils';
import Artist from '../artist/artist.model';
import { IAuth } from '../auth/auth.interface';
import Auth from '../auth/auth.model';
import BusinessPreferences from '../businessPreferences/businessPreferences.model';
import Business from './business.model';
import {
  TUpdateBusinessNotificationPayload,
  TUpdateBusinessProfilePayload,
  TUpdateBusinessSecuritySettingsPayload,
} from './business.validation';

// Update Business Profile
const updateBusinessProfile = async (
  user: IAuth,
  payload: TUpdateBusinessProfilePayload
) => {
  const business = await Business.findOne({ auth: user._id });

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  const session = await startSession();

  try {
    session.startTransaction();

    // Update Auth data with new business details
    await Auth.findByIdAndUpdate(user._id, payload, { session });

    // Update Business data with new business details
    const updatedBusiness = await Business.findOneAndUpdate(
      { auth: user._id },
      {
        studioName: payload.studioName,
        businessType: payload.businessType,
        country: payload.country,
      },
      { new: true, session }
    ).populate([
      {
        path: 'auth',
        select: 'fullName email phoneNumber',
      },
    ]);

    await session.commitTransaction();
    await session.endSession();

    return updatedBusiness;
  } catch {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Something went wrong while updating business profile data'
    );
  }
};

// Update Business Preferences
const updateBusinessPreferences = async (
  user: IAuth,
  payload: TUpdateBusinessProfilePayload
) => {
  // Find the business using the auth user_id
  const business = await Business.findOne({ auth: user._id });
  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // Find and update business preferences, or create new ones if not found
  const preferences = await BusinessPreferences.findOneAndUpdate(
    { businessId: business._id },
    payload,
    { new: true, upsert: true }
  );

  if (!preferences) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error updating business preferences'
    );
  }

  return preferences;
};

// Update Business Notification Preferences
const updateBusinessNotificationPreferences = async (
  user: IAuth,
  payload: TUpdateBusinessNotificationPayload
) => {
  // Step 1: Find the business
  const business = await Business.findOne({ auth: user._id });
  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // Step 2: Find and update the business's notification preferences
  const preferences = await BusinessPreferences.findOneAndUpdate(
    { businessId: business._id },
    payload,
    { new: true }
  );

  if (!preferences) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Preferences not found for this business'
    );
  }

  // Return the updated preferences
  return preferences;
};

// Update Business Security Settings
const updateBusinessSecuritySettings = async (
  user: IAuth,
  payload: TUpdateBusinessSecuritySettingsPayload
) => {
  // Step 1: Find the business
  const business = await Business.findOne({ auth: user._id });
  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // Step 2: Find and update the business's notification preferences
  const preferences = await BusinessPreferences.findOneAndUpdate(
    { businessId: business._id },
    payload,
    { new: true }
  );

  if (!preferences) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Preferences not found for this business'
    );
  }

  // Return the updated preferences
  return preferences;
};

// updateGuestSpotsIntoDB
// const updateGuestSpotsIntoDB = async (user: IAuth, data: any) => {
//   // Find the business
//   const business = await Business.findOne({ auth: user._id });
//   if (!business) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
//   }

//   // Update guest spots logic
//   const guestSpots = data.guestSpots;

//   await business.save();

//   return business;
// };

// updateTimeOff
const updateTimeOff = async (user: IAuth, data: any) => {
  // Handle time-off for business (if needed)
  // Assuming time-off is stored as blocked dates for a business

  const business = await Business.findOne({ auth: user._id });
  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // Add the time-off logic
  business.timeOff.push(data.date);
  await business.save();

  return business;
};

const getBusinessArtists = async (
  user: IAuth,
  query: Record<string, any> = {}
) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const business = await Business.findOne({ auth: user._id });
  if (!business)
    throw new AppError(httpStatus.BAD_REQUEST, 'business not found');

  const pipeline: any[] = [
    {
      $match: {
        business: new mongoose.Types.ObjectId(business._id),
        isConnBusiness: true,
      },
    },

    // 🔹 Lookup artist auth info
    {
      $lookup: {
        from: 'auths',
        localField: 'auth',
        foreignField: '_id',
        as: 'artistAuth',
      },
    },
    { $unwind: '$artistAuth' },

    // 🔹 Lookup business info
    {
      $lookup: {
        from: 'businesses',
        localField: 'business',
        foreignField: '_id',
        as: 'businessInfo',
      },
    },
    { $unwind: '$businessInfo' },

    // 🔹 Final projection
    {
      $project: {
        _id: 1,
        fullName: '$artistAuth.fullName',
        email: '$artistAuth.email',
        phone: '$artistAuth.phone',
        city: 1,
        stringLocation: 1,
        avgRating: 1,
        portfolio: 1,
        flashes: 1,
      },
    },

    // Pagination
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await Artist.aggregate(pipeline);

  // total count (without pagination)
  const total = await Artist.countDocuments({
    business: business._id,
    isConnBusiness: true,
  });

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

// removeArtistFromDB
const removeArtistFromDB = async (user: IAuth, artistId: string) => {
  const business = await Business.findOne({ auth: user._id });

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  return await Business.findByIdAndUpdate(
    business._id,
    { $pull: { residentArtists: artistId } },
    { new: true }
  );
};

export const BusinessService = {
  updateBusinessProfile,
  updateBusinessPreferences,
  updateBusinessNotificationPreferences,
  updateBusinessSecuritySettings,
  // updateGuestSpotsIntoDB,
  getBusinessArtists,
  updateTimeOff,
  removeArtistFromDB,
};

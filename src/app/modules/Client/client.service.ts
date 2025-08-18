/* eslint-disable no-unused-vars */
import status from 'http-status';
import { AppError } from '../../utils';
import Artist from '../Artist/artist.model';
import { IAuth } from '../Auth/auth.interface';
import Auth from '../Auth/auth.model';
import ClientPreferences from '../ClientPreferences/clientPreferences.model';
import Client from './client.model';
import {
  TUpdateNotificationPayload,
  TUpdatePreferencePayload,
  TUpdateProfilePayload,
  TUpdateSecuritySettingsPayload,
} from './client.validation';

const updateProfile = async (user: IAuth, payload: TUpdateProfilePayload) => {
  const result = await Auth.findByIdAndUpdate(user._id, payload, {
    new: true,
    select: 'fullName',
  });
  return result;
};

const updatePreferences = async (
  user: IAuth,
  payload: TUpdatePreferencePayload
) => {
  // Find the client using the auth user_id
  const client = await Client.findOne({ auth: user._id });
  if (!client) {
    throw new AppError(status.NOT_FOUND, 'Client not found');
  }

  console.log('client', client);

  const result = await Client.findByIdAndUpdate(client._id, payload, {
    new: true,
  });

  console.log('update preferrence', result);

  // Find and update preferences, or create new ones if not found

  if (!result) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Error updating preferences'
    );
  }

  return result;
};

const updateNotificationPreferences = async (
  user: IAuth,
  payload: TUpdateNotificationPayload
) => {
  // Step 1: Find the client
  const client = await Client.findOne({ auth: user._id });
  if (!client) {
    throw new AppError(status.NOT_FOUND, 'Client not found');
  }

  console.log('payload', payload);
  const updateData = payload.all
    ? {
        bookingConfirmations: true,
        bookingReminders: true,
        bookingCancellations: true,
        newMessageNotifications: true,
        appUpdates: true,
        newAvailability: true,
        lastMinuteBookings: true,
        newGuestArtists: true,
      }
    : {
        bookingConfirmations: payload.bookingConfirmations,
        bookingReminders: payload.bookingReminders,
        bookingCancellations: payload.bookingCancellations,
        newMessageNotifications: payload.newMessageNotifications,
        appUpdates: payload.appUpdates,
        newAvailability: payload.newAvailability,
        lastMinuteBookings: payload.lastMinuteBookings,
        newGuestArtists: payload.newGuestArtists,
        notificationPreferences: payload.notificationPreferences,
      };

  // Step 2: Find and update the client's notification preferences
  const preferences = await ClientPreferences.findOneAndUpdate(
    { clientId: client._id },
    updateData,
    { new: true }
  );

  if (!preferences) {
    throw new AppError(
      status.NOT_FOUND,
      'Preferences not found for this client'
    );
  }

  // Return the updated preferences
  return updateData;
};

const updatePrivacySecuritySettings = async (
  user: IAuth,
  payload: TUpdateSecuritySettingsPayload
) => {
  const client = await Client.findOne({ auth: user._id }).select('_id');
  if (!client) {
    throw new AppError(status.NOT_FOUND, 'Client not found');
  }

  const updatedPreferences = await ClientPreferences.findOneAndUpdate(
    { clientId: client._id },
    { $set: payload },
    {
      new: true,
      projection: {
        twoFactorAuthEnabled: 1,
        locationSuggestions: 1,
        personalizedContent: 1,
        _id: 0,
      },
    }
  );

  if (!updatedPreferences) {
    throw new AppError(status.NOT_FOUND, 'Client preferences not found');
  }

  return updatedPreferences;
};

const fetchDiscoverArtistFromDB = async (
  user: IAuth,
  query: Record<string, unknown>
) => {
  // Fetch the client data
  const client = await Client.findOne({ auth: user._id });

  if (!client) {
    throw new AppError(status.NOT_FOUND, 'Client not found');
  }

  // Define the earth radius in kilometers (6378.1 km) - This is useful for understanding the scale
  const longitude = client.location.coordinates[0]; // Client longitude
  const latitude = client.location.coordinates[1]; // Client latitude
  const radius = client.radius; // Client's search radius (in kilometers)

  // Check if 'query.type' is provided. If not, fetch all types.
  let artistTypeFilter = {};
  if (typeof query?.type === 'string') {
    // Case-insensitive match using regex if type is provided
    artistTypeFilter = {
      type: {
        $regex: new RegExp(query?.type, 'i'), // 'i' for case-insensitive search
      },
    };
  }

  // Pagination parameters
  const page = parseInt(query?.page as string, 10) || 1; // Default to page 1 if not provided
  const limit = parseInt(query?.limit as string, 10) || 10; // Default to 10 items per page if not provided

  // Calculate skip value based on page and pageSize
  const skip = (page - 1) * limit;

  // Perform the count query to get the total number of matching artists
  const totalArtists = await Artist.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude], // Client's location [longitude, latitude]
        },
        distanceField: 'distance',
        maxDistance: radius * 1000, // Convert radius to meters (radius is in kilometers, so multiply by 1000)
        spherical: true, // Use spherical geometry to calculate distance accurately
      },
    },
    {
      $match: {
        ...artistTypeFilter,
      },
    },
    {
      $count: 'totalArtists', // Count the total number of artists
    },
  ]);

  // Calculate the total number of pages
  const total = totalArtists[0]?.totalArtists || 0;
  const totalPage = Math.ceil(total / limit); // Total pages

  // Aggregation query to find artists within the specified radius
  const artists = await Artist.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude], // Client's location [longitude, latitude]
        },
        distanceField: 'distance',
        maxDistance: radius * 1000, // Convert radius to meters (radius is in kilometers, so multiply by 1000)
        spherical: true, // Use spherical geometry to calculate distance accurately
      },
    },
    {
      $match: {
        ...artistTypeFilter,
      },
    },
    {
      $lookup: {
        from: 'auths',
        localField: 'auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    {
      $unwind: {
        path: '$auth',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        type: 1,
        expertise: 1,
        city: 1,
        profileViews: 1,
        location: 1,
        distance: 1,
        'auth._id': 1,
        'auth.fullName': 1,
        'auth.email': 1,
        'auth.phoneNumber': 1,
        'auth.image': 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  // Return data with pagination metadata
  return {
    data: artists,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

export const ClientService = {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  updatePrivacySecuritySettings,
  fetchDiscoverArtistFromDB,
  
};

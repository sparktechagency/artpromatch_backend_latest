import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { ClientService } from './client.service';
import sendResponse from '../../utils/sendResponse';

const updateProfile = asyncHandler(async (req, res) => {
  const result = await ClientService.updateProfile(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile information updated successfully!',
    data: result,
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const result = await ClientService.updatePreferences(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Preferences updated successfully!',
    data: result,
  });
});

const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await ClientService.updateNotificationPreferences(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Notification preferences updated successfully!',
    data: result,
  });
});

const updatePrivacySecuritySettings = asyncHandler(async (req, res) => {
  const result = await ClientService.updatePrivacySecuritySettings(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Privacy and security settings updated successfully!',
    data: result,
  });
});

const fetchDiscoverArtists = asyncHandler(async (req, res) => {
  const result = await ClientService.fetchDiscoverArtistFromDB(
    req.user,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Discover artists retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

export const ClientController = {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  updatePrivacySecuritySettings,
  fetchDiscoverArtists,
};

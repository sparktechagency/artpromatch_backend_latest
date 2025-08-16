import status from 'http-status';
import { AppResponse, asyncHandler } from '../../utils';
import { ClientService } from './client.service';

const updateProfile = asyncHandler(async (req, res) => {
  const result = await ClientService.updateProfile(req.user, req.body);

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        result,
        'Profile information update successfully'
      )
    );
});

const updatePreferences = asyncHandler(async (req, res) => {
  const result = await ClientService.updatePreferences(req.user, req.body);

  res
    .status(status.OK)
    .json(
      new AppResponse(status.OK, result, 'Preferences updated successfully')
    );
});

const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await ClientService.updateNotificationPreferences(
    req.user,
    req.body
  );

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        result,
        'Notification preferences updated successfully'
      )
    );
});

const updatePrivacySecuritySettings = asyncHandler(async (req, res) => {
  const result = await ClientService.updatePrivacySecuritySettings(
    req.user,
    req.body
  );

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        result,
        'Privacy and security settings updated successfully'
      )
    );
});



const fetchDiscoverArtists = asyncHandler(async (req, res) => {
  const { data, meta } = await ClientService.fetchDiscoverArtistFromDB(
    req.user,
    req.query
  );

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        data,
        'Discover artists retrieved successfully',
        meta
      )
    );
});

export const ClientController = {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  updatePrivacySecuritySettings,
  fetchDiscoverArtists,
};

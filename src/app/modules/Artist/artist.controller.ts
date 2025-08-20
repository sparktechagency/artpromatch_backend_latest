/* eslint-disable no-undef */
import status from 'http-status';
import { AppResponse, asyncHandler } from '../../utils';
import { ArtistService } from './artist.service';

// update profile
const updateProfile = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateProfile(req.user, req.body);

  res
    .status(status.OK)
    .json(
      new AppResponse(status.OK, result, 'Artist profile updated successfully')
    );
});

// update preferrence
const updatePreferences = asyncHandler(async (req, res) => {
  const result = await ArtistService.updatePreferences(req.user, req.body);

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        result,
        'Artist preferences updated successfully'
      )
    );
});

// update notification prefereence
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateNotificationPreferences(
    req.user,
    req.body
  );

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        result,
        'Artist notification preferences updated successfully'
      )
    );
});

// update Privacy security settings
const updatePrivacySecuritySettings = asyncHandler(async (req, res) => {
  const result = await ArtistService.updatePrivacySecuritySettings(
    req.user,
    req.body
  );

  res
    .status(status.OK)
    .json(
      new AppResponse(
        status.OK,
        result,
        'Artist privacy and security settings updated successfully'
      )
    );
});

// update artist flashes
const updateArtistFlashes = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await ArtistService.addFlashesIntoDB(req.user, files);

  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Flashes update successfully'));
});

//update artist 
const updateArtistPortfolio = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await ArtistService.addPortfolioImages(req.user, files);

  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Flashes update successfully'));
});

// remove image
const removeImage = asyncHandler(async (req, res) => {
  const filePath = req.body.filePath;
  const result = await ArtistService.removeImage(req.user, filePath);

  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Flash remove successfully'));
});

// update artist personal info
const updateArtistPersonalInfo = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateArtistPersonalInfoIntoDB(
    req.user,
    req.body
  );

  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Update profile successfully'));
});

// save availibility
const saveAvailability = asyncHandler(async (req, res) => {
  const result = await ArtistService.saveAvailabilityIntoDB(req.user, req.body);
  const filtered = result[req.body.day].map((slot: any) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));

  res
    .status(status.OK)
    .json(new AppResponse(status.OK, filtered, 'Save availability successfully'));
});

// fetch all artist
const fetchAllArtists = asyncHandler(async (req, res) => {
  const { data, meta } = await ArtistService.fetchAllArtistsFromDB(req.query);

  res
    .status(status.OK)
    .json(
      new AppResponse(status.OK, data, 'Artists retrieved successfully', meta)
    );
});

// For availability
const updateAvailability = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateAvailability(req.user, req.body);
  res
    .status(status.OK)
    .json(
      new AppResponse(status.OK, result, 'Availability updated successfully')
    );
});

// update timeoff
const updateTimeOff = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateTimeOff(req.user, req.body);
  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Time off updated successfully'));
});

// get availibility
const getAvailabilityExcludingTimeOff = asyncHandler(async (req, res) => {
  const artistId = req.params.id;
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  const result = await ArtistService.getAvailabilityExcludingTimeOff(
    artistId,
    month,
    year
  );

  res
    .status(status.OK)
    .json(
      new AppResponse(status.OK, result, 'Availability retrieved successfully')
    );
});

export const ArtistController = {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  updatePrivacySecuritySettings,
  updateArtistFlashes,
  removeImage,
  updateArtistPersonalInfo,
  updateArtistPortfolio,
  saveAvailability,
  fetchAllArtists,
  updateAvailability,
  updateTimeOff,
  getAvailabilityExcludingTimeOff,
};

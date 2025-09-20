import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { TServiceImages } from '../Service/service.interface';
import { ArtistService } from './artist.service';
import Stripe from 'stripe';
import config from '../../config';


const stripe = new Stripe(config.stripe.stripe_secret_key as string, {});

// getAllArtists
const getAllArtists = asyncHandler(async (req, res) => {
  const result = await ArtistService.getAllArtistsFromDB(req.query, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artists retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// update artist personal info
const updateArtistPersonalInfo = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateArtistPersonalInfoIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Updated profile successfully!',
    data: result,
  });
});

// updateArtistProfile
const updateArtistProfile = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateArtistProfileIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist profile updated successfully!',
    data: result,
  });
});

// updateArtistPreferences
const updateArtistPreferences = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateArtistPreferencesIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist preferences updated successfully!',
    data: result,
  });
});

// updateArtistNotificationPreferences
const updateArtistNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateArtistNotificationPreferencesIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist notification preferences updated successfully!',
    data: result,
  });
});

// updateArtistPrivacySecuritySettings
const updateArtistPrivacySecuritySettings = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateArtistPrivacySecuritySettingsIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist privacy and security settings updated successfully!',
    data: result,
  });
});

// update artist flashes
const updateArtistFlashes = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await ArtistService.updateArtistFlashesIntoDB(req.user, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Flashes updated successfully!',
    data: result,
  });
});

// update artist
const updateArtistPortfolio = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await ArtistService.updateArtistPortfolioIntoDB(
    req.user,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Portfolio updated successfully!',
    data: result,
  });
});

// addArtistService
const addArtistService = asyncHandler(async (req, res) => {
  const files = req.files as TServiceImages;
  const result = await ArtistService.createService(req.user, req.body, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Service created successfully!',
    data: result,
  });
});

const getServicesByArtist = asyncHandler(async (req, res) => {
  const result = await ArtistService.getServicesByArtistFromDB(req.user);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Services retrieved successfully!',
    data: result,
  });
});

// updateArtistServiceById
const updateArtistServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ArtistService.updateArtistServiceByIdIntoDB(
    id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Service updated successfully!',
    data: result,
  });
});

// deleteArtistService
const deleteArtistService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ArtistService.deleteArtistServiceFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Service deleted successfully!',
    data: result,
  });
});

// removeimage
const removeImage = asyncHandler(async (req, res) => {
  const filePath = req.body.filePath;
  const result = await ArtistService.removeImageFromDB(req.user, filePath);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Flash removed successfully!',
    data: result,
  });
});

// saveArtistAvailability
const saveArtistAvailability = asyncHandler(async (req, res) => {
  const result = await ArtistService.saveArtistAvailabilityIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Saved availability successfully!',
    data: result,
  });
});

// setArtistTimeOff
const setArtistTimeOff = asyncHandler(async (req, res) => {
  const result = await ArtistService.setArtistTimeOffIntoDB(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Time off updated successfully!',
    data: result,
  });
});

// createConnectedAccountAndOnboardingLinkForArtist
const createConnectedAccountAndOnboardingLinkForArtist = asyncHandler(
  async (req, res) => {
    const result =
      await ArtistService.createConnectedAccountAndOnboardingLinkForArtistIntoDb(
        req.user
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Onboarding account url is generated successfully!',
      data: result,
    });
  }
);

const deleteAccount = asyncHandler(async (req, res) => {
  await stripe.accounts.del(req.body.accountId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'account deleted successfully!',
    data: null
  });
});

// get availibility
// const getAvailabilityExcludingTimeOff = asyncHandler(async (req, res) => {
//   const artistId = req.params.id;
//   const month = Number(req.query.month);
//   const year = Number(req.query.year);
//   const result = await ArtistService.getAvailabilityExcludingTimeOff(
//     artistId,
//     month,
//     year
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Availability retrieved successfully!',
//     data: result,
//   });
// });

// For availability
// const updateAvailability = asyncHandler(async (req, res) => {
//   const result = await ArtistService.updateAvailability(req.user, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Availability updated successfully!',
//     data: result,
//   });
// });

export const ArtistController = {
  getAllArtists,
  updateArtistPersonalInfo,
  updateArtistProfile,
  updateArtistPreferences,
  updateArtistNotificationPreferences,
  updateArtistPrivacySecuritySettings,
  updateArtistFlashes,
  updateArtistPortfolio,
  addArtistService,
  getServicesByArtist,
  updateArtistServiceById,
  deleteArtistService,
  removeImage,
  saveArtistAvailability,
  setArtistTimeOff,
  createConnectedAccountAndOnboardingLinkForArtist,
  deleteAccount
  // updateAvailability,
  // getAvailabilityExcludingTimeOff,
};

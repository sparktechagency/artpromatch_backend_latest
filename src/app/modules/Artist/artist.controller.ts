import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../../config';
import { AppError, asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { TServiceImages } from '../Service/service.interface';
import { ArtistService } from './artist.service';

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

// getOwnArtistData
const getOwnArtistData = asyncHandler(async (req, res) => {
  const result = await ArtistService.getOwnArtistDataFromDB(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist retrieved successfully!',
    data: result,
  });
});

// getSingleArtist
const getSingleArtist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ArtistService.getSingleArtistFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist retrieved successfully!',
    data: result,
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

// boost profile
const boostProfile = asyncHandler(async (req, res) => {
  const result = await ArtistService.boostProfileIntoDb(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Complete the payment quickly!',
    data: result,
  });
});

// confirm boost payment
const confirmBoostPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await ArtistService.confirmBoostPaymentIntoDb(sessionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile boosted successfully!',
    data: result,
  });
});

// getArtistProfileByHisId
const getArtistProfileByHisId = asyncHandler(async (req, res) => {
  const { Id } = req.params;
  const result = await ArtistService.getArtistProfileByHisIdFromDB(Id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile retrived successfully!',
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

// createArtistService
const createArtistService = asyncHandler(async (req, res) => {
  const files = req.files as TServiceImages;

  if (!files.thumbnail[0]) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Thumbnail is required');
  }

  if (
    files.images.length &&
    (files.images.length < 2 || files.images.length > 5)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Images must be between two to five'
    );
  }

  const result = await ArtistService.createArtistServiceIntoDB(
    req.user,
    req.body,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Service created successfully!',
    data: result,
  });
});

// createArtistService
const getArtistServiceDetails = asyncHandler(async (req, res) => {
  const result = await ArtistService.getServiceDetailsFromDB(
    req.user,
    req.params.id
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Service retrieved successfully!',
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

const getArtistSchedule = asyncHandler(async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const result = await ArtistService.getArtistMonthlySchedule(
    req.user,
    year,
    month
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Services retrieved successfully!',
    data: result,
  });
});

// updateArtistServiceById
const updateArtistServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const files = req.files as TServiceImages;
  const result = await ArtistService.updateArtistServiceByIdIntoDB(
    id,
    req.body,
    files,
    req.user
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Service updated successfully!',
    data: result,
  });
});

// get artist dashboard
const getArtistDashboardPage = asyncHandler(async (req, res) => {
  const result = await ArtistService.getArtistDashboardPage(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Dashboard fetched successfully!',
    data: result,
  });
});

// deleteArtistService
const deleteArtistService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ArtistService.deleteArtistServiceFromDB(id, req.user);

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
    data: null,
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
  getOwnArtistData,
  getSingleArtist,
  updateArtistPersonalInfo,
  updateArtistProfile,
  boostProfile,
  confirmBoostPayment,
  getArtistProfileByHisId,
  updateArtistPreferences,
  updateArtistNotificationPreferences,
  updateArtistPrivacySecuritySettings,
  updateArtistFlashes,
  updateArtistPortfolio,
  createArtistService,
  getServicesByArtist,
  getArtistServiceDetails,
  getArtistSchedule,
  updateArtistServiceById,
  deleteArtistService,
  removeImage,
  createConnectedAccountAndOnboardingLinkForArtist,
  deleteAccount,
  getArtistDashboardPage,
  // updateAvailability,
  // getAvailabilityExcludingTimeOff,
};

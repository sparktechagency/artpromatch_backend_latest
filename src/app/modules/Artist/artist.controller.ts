import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { ArtistService } from './artist.service';
import sendResponse from '../../utils/sendResponse';
import { TServiceImage} from '../ArtistServices/artist.services.interface';

// update profile
const updateProfile = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateProfile(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist profile updated successfully!',
    data: result,
  });
});

// update preferrence
const updatePreferences = asyncHandler(async (req, res) => {
  const result = await ArtistService.updatePreferences(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist preferences updated successfully!',
    data: result,
  });
});

// update notification prefereence
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateNotificationPreferences(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist notification preferences updated successfully!',
    data: result,
  });
});

// update Privacy security settings
const updatePrivacySecuritySettings = asyncHandler(async (req, res) => {
  const result = await ArtistService.updatePrivacySecuritySettings(
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
  const result = await ArtistService.addFlashesIntoDB(req.user, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Flashes updated successfully!',
    data: result,
  });
});

//update artist
const updateArtistPortfolio = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await ArtistService.addPortfolioImages(req.user, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Portfolio updated successfully!',
    data: result,
  });
});

// remove image
const removeImage = asyncHandler(async (req, res) => {
  const filePath = req.body.filePath;
  const result = await ArtistService.removeImage(req.user, filePath);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Flash removed successfully!',
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

// save availibility
const saveAvailability = asyncHandler(async (req, res) => {
  const result = await ArtistService.saveAvailabilityIntoDB(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Saved availability successfully!',
    data: result,
  });
});

// fetch all artist
const fetchAllArtists = asyncHandler(async (req, res) => {
  const result = await ArtistService.fetchAllArtistsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artists retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// For availability
// const updateAvailability = asyncHandler(async (req, res) => {
//   const result = await ArtistService.updateAvailability(req.user, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Availability updated successfully!',
//     data: result,
//   });
// });

// update timeoff
const updateTimeOff = asyncHandler(async (req, res) => {
  const result = await ArtistService.updateTimeOff(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Time off updated successfully!',
    data: result,
  });
});

// update timeoff
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

// addService
export const addService = asyncHandler(async (req, res) => {
  const files = (req.files as TServiceImage) || {};
  const result = await ArtistService.createService(req.user,req.body,files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Service created successfully!',
    data: result,
  });
});


export const getSpecificServices = asyncHandler(async (req, res) => {
  const result = await ArtistService.getServicesByArtist(req.user);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Service created successfully!',
    data: result,
  });
});


// updateService
export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ArtistService.updateServiceById(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Service updated successfully!',
    data: result,
  });
});

// deleteService
export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ArtistService.deleteServiceById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Service deleted successfully!',
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

export const ArtistController = {
  addService,
  updateService,
  deleteService,
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
  // updateAvailability,
  updateTimeOff,
  getSpecificServices,
  createConnectedAccountAndOnboardingLinkForArtist,
  // getAvailabilityExcludingTimeOff,
};

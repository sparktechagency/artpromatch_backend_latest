"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../../config"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const artist_service_1 = require("./artist.service");
const stripe = new stripe_1.default(config_1.default.stripe.stripe_secret_key, {});
// getAllArtists
const getAllArtists = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.getAllArtistsFromDB(req.query, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artists retrieved successfully!',
        data: result.data,
        meta: result.meta,
    });
});
// getOwnArtistData
const getOwnArtistData = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.getOwnArtistDataFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist retrieved successfully!',
        data: result,
    });
});
// getSingleArtist
const getSingleArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await artist_service_1.ArtistService.getSingleArtistFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist retrieved successfully!',
        data: result,
    });
});
// update artist personal info
const updateArtistPersonalInfo = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.updateArtistPersonalInfoIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Updated profile successfully!',
        data: result,
    });
});
// updateArtistProfile
const updateArtistProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.updateArtistProfileIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist profile updated successfully!',
        data: result,
    });
});
// updateArtistPreferences
const updateArtistPreferences = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.updateArtistPreferencesIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist preferences updated successfully!',
        data: result,
    });
});
// updateArtistNotificationPreferences
const updateArtistNotificationPreferences = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.updateArtistNotificationPreferencesIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist notification preferences updated successfully!',
        data: result,
    });
});
// updateArtistPrivacySecuritySettings
const updateArtistPrivacySecuritySettings = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.updateArtistPrivacySecuritySettingsIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist privacy and security settings updated successfully!',
        data: result,
    });
});
// update artist flashes
const updateArtistFlashes = (0, utils_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    const result = await artist_service_1.ArtistService.updateArtistFlashesIntoDB(req.user, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Flashes updated successfully!',
        data: result,
    });
});
// boost profile
const boostProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.boostProfileIntoDb(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'profile boost successfully!',
        data: result,
    });
});
// update artist
const updateArtistPortfolio = (0, utils_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    const result = await artist_service_1.ArtistService.updateArtistPortfolioIntoDB(req.user, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Portfolio updated successfully!',
        data: result,
    });
});
// addArtistService
const addArtistService = (0, utils_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    const result = await artist_service_1.ArtistService.createService(req.user, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Service created successfully!',
        data: result,
    });
});
const getServicesByArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.getServicesByArtistFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Services retrieved successfully!',
        data: result,
    });
});
const getArtistSchedule = (0, utils_1.asyncHandler)(async (req, res) => {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const result = await artist_service_1.ArtistService.getArtistMonthlySchedule(req.user, year, month);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Services retrieved successfully!',
        data: result,
    });
});
// updateArtistServiceById
const updateArtistServiceById = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const files = req.files;
    const result = await artist_service_1.ArtistService.updateArtistServiceByIdIntoDB(id, req.body, files, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Service updated successfully!',
        data: result,
    });
});
// deleteArtistService
const deleteArtistService = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await artist_service_1.ArtistService.deleteArtistServiceFromDB(id, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Service deleted successfully!',
        data: result,
    });
});
// removeimage
const removeImage = (0, utils_1.asyncHandler)(async (req, res) => {
    const filePath = req.body.filePath;
    const result = await artist_service_1.ArtistService.removeImageFromDB(req.user, filePath);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Flash removed successfully!',
        data: result,
    });
});
// saveArtistAvailability
const saveArtistAvailability = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.saveArtistAvailabilityIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Saved availability successfully!',
        data: result,
    });
});
// setArtistTimeOff
const setArtistTimeOff = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.setArtistTimeOffIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Time off updated successfully!',
        data: result,
    });
});
// createConnectedAccountAndOnboardingLinkForArtist
const createConnectedAccountAndOnboardingLinkForArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await artist_service_1.ArtistService.createConnectedAccountAndOnboardingLinkForArtistIntoDb(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Onboarding account url is generated successfully!',
        data: result,
    });
});
const deleteAccount = (0, utils_1.asyncHandler)(async (req, res) => {
    await stripe.accounts.del(req.body.accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
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
exports.ArtistController = {
    getAllArtists,
    getOwnArtistData,
    getSingleArtist,
    updateArtistPersonalInfo,
    updateArtistProfile,
    boostProfile,
    updateArtistPreferences,
    updateArtistNotificationPreferences,
    updateArtistPrivacySecuritySettings,
    updateArtistFlashes,
    updateArtistPortfolio,
    addArtistService,
    getServicesByArtist,
    getArtistSchedule,
    updateArtistServiceById,
    deleteArtistService,
    removeImage,
    saveArtistAvailability,
    setArtistTimeOff,
    createConnectedAccountAndOnboardingLinkForArtist,
    deleteAccount,
    // updateAvailability,
    // getAvailabilityExcludingTimeOff,
};

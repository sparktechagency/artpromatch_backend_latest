"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const business_service_1 = require("./business.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const updateBusinessProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.updateBusinessProfile(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Business profile updated successfully!',
        data: result,
    });
});
const updateBusinessPreferences = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.updateBusinessPreferences(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Business preferences updated successfully!',
        data: result,
    });
});
const updateBusinessNotificationPreferences = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.updateBusinessNotificationPreferences(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Business notification preferences updated successfully!',
        data: result,
    });
});
const updateBusinessSecuritySettings = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.updateBusinessSecuritySettings(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Business security and privacy settings updated successfully!',
        data: result,
    });
});
// updateAvailability
// const updateAvailability = asyncHandler(async (req, res) => {
//   const result = await BusinessService.updateGuestSpotsIntoDB(req.user, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Guest spots updated successfully!',
//     data: result,
//   });
// });
const updateTimeOff = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.updateTimeOff(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Time off updated successfully!',
        data: result,
    });
});
const fetchBusinessArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.getBusinessArtists(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist removed successfully!',
        data: result,
    });
});
const removeArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await business_service_1.BusinessService.removeArtistFromDB(req.user, req.params.artistId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist removed successfully!',
        data: result,
    });
});
exports.BusinessController = {
    updateBusinessProfile,
    updateBusinessPreferences,
    updateBusinessNotificationPreferences,
    updateBusinessSecuritySettings,
    // updateAvailability,
    fetchBusinessArtist,
    updateTimeOff,
    removeArtist,
};

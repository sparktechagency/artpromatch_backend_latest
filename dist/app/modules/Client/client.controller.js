"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const client_service_1 = require("./client.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_model_1 = require("../Auth/auth.model");
const lib_1 = require("../../lib");
const config_1 = __importDefault(require("../../config"));
// updateProfile
const updateProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await client_service_1.ClientService.updateProfile(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Profile information updated successfully!',
        data: result,
    });
});
// updatePreferences
const updatePreferences = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await client_service_1.ClientService.updatePreferences(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Preferences updated successfully!',
        data: result,
    });
});
// updateNotificationPreferences
const updateNotificationPreferences = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await client_service_1.ClientService.updateNotificationPreferences(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Notification preferences updated successfully!',
        data: result,
    });
});
// updatePrivacySecuritySettings
const updatePrivacySecuritySettings = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await client_service_1.ClientService.updatePrivacySecuritySettings(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Privacy and security settings updated successfully!',
        data: result,
    });
});
// getDiscoverArtists
const getDiscoverArtists = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await client_service_1.ClientService.getDiscoverArtistsFromDB(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Discover artists retrieved successfully!',
        data: result.data,
        meta: result.meta,
    });
});
// getAllServices
const getAllServices = (0, utils_1.asyncHandler)(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    let decoded = {};
    if (token) {
        decoded = (0, lib_1.verifyToken)(token, config_1.default.jwt.access_secret);
    }
    const { id } = decoded;
    const user = await auth_model_1.Auth.findById(id);
    const result = await client_service_1.ClientService.getAllServicesFromDB(user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Discover artists retrieved successfully!',
        data: result.data,
        meta: result.meta,
    });
});
// updateClientRadius
const updateClientRadius = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await client_service_1.ClientService.updateClientRadiusIntoDB(req.user, req.body.radius);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Radius updated successfully!',
        data: result,
    });
});
exports.ClientController = {
    updateProfile,
    updatePreferences,
    updateNotificationPreferences,
    updatePrivacySecuritySettings,
    getDiscoverArtists,
    getAllServices,
    updateClientRadius,
};

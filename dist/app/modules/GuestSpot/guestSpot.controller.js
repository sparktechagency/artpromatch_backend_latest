"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestSpotController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const guestSpot_service_1 = require("./guestSpot.service");
// createGuestSpot
const createGuestSpot = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await guestSpot_service_1.GuestSpotService.createGuestSpotIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'GuestSpot created successfully!',
        data: result,
    });
});
// updateGuestSpot
const updateGuestSpot = (0, utils_1.asyncHandler)(async (req, res) => {
    const { guestSpotId } = req.params;
    const result = await guestSpot_service_1.GuestSpotService.updateGuestSpotIntoDB(req.user, guestSpotId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'GuestSpot updated successfully!',
        data: result,
    });
});
exports.GuestSpotController = {
    createGuestSpot,
    updateGuestSpot,
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const notification_services_1 = __importDefault(require("./notification.services"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const getNotifications = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const data = await notification_services_1.default.getAllNotifications(req.query, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Notification seen successfully',
        data: data,
    });
});
const markAsSeen = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = await notification_services_1.default.markNotificationAsSeen(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Notification seen successfully',
        data: data,
    });
});
const getUnseenNotificationCount = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const count = await notification_services_1.default.getAllUnseenNotificationCount(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Unseen notification count fetched successfully',
        data: count,
    });
});
exports.default = {
    getNotifications,
    markAsSeen,
    getUnseenNotificationCount,
};

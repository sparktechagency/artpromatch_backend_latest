"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_model_1 = __importDefault(require("../modules/notification/notification.model"));
const socketConnection_1 = require("../socket/socketConnection");
const getUnseenNotificationCount_1 = __importDefault(require("./getUnseenNotificationCount"));
const sendNotification = async (notificationData) => {
    const io = (0, socketConnection_1.getSocketIO)();
    await notification_model_1.default.create(notificationData);
    const updatedNotification = await (0, getUnseenNotificationCount_1.default)(notificationData.receiver.toString());
    io.to(notificationData.receiver.toString()).emit('notification', updatedNotification);
};
exports.default = sendNotification;

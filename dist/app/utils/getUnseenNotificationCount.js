"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_model_1 = __importDefault(require("../modules/notification/notification.model"));
const getUserNotificationCount = async (receiver) => {
    const unseenCount = await notification_model_1.default.countDocuments({
        seen: false,
        receiver: receiver,
    });
    const latestNotification = await notification_model_1.default.findOne({
        receiver: receiver,
    })
        .sort({ createdAt: -1 })
        .lean();
    return { unseenCount, latestNotification };
};
exports.default = getUserNotificationCount;

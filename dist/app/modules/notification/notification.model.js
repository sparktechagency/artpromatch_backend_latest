"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notification_constant_1 = require("./notification.constant");
const notificationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(notification_constant_1.NOTIFICATION_TYPE),
        required: true,
    },
    redirectId: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const Notification = (0, mongoose_1.model)('Notification', notificationSchema);
exports.default = Notification;

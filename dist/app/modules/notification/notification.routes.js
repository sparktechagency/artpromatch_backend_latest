"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = __importDefault(require("./notification.controller"));
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const notificationRouter = express_1.default.Router();
notificationRouter.get('/get-notifications/:id', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT), notification_controller_1.default.getNotifications);
notificationRouter.patch('/mark-notification', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT), notification_controller_1.default.markAsSeen);
notificationRouter.get('/unseen-notification-count/:id', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT), notification_controller_1.default.getUnseenNotificationCount);
exports.default = notificationRouter;

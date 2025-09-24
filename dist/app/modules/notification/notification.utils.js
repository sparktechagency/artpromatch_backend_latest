"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = exports.sendNotificationBySocket = exports.sendNotificationByEmail = void 0;
const http_status_1 = __importDefault(require("http-status"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../../config"));
const firebase_config_1 = __importDefault(require("../../config/firebase.config"));
const socketConnection_1 = require("../../socket/socketConnection");
const utils_1 = require("../../utils");
const getUnseenNotificationCount_1 = __importDefault(require("../../utils/getUnseenNotificationCount"));
const notification_model_1 = __importDefault(require("./notification.model"));
const notification_template_1 = require("./notification.template");
const sendNotificationByEmail = async (email, type, data) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: config_1.default.nodemailer.email,
                pass: config_1.default.nodemailer.password,
            },
        });
        const html = notification_template_1.notificationTemplates[type](data);
        const mailOptions = {
            from: config_1.default.nodemailer.email,
            to: email,
            subject: `Steady Hands - ${type.replace('_', ' ')}`,
            html,
        };
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to send email');
    }
};
exports.sendNotificationByEmail = sendNotificationByEmail;
const sendNotificationBySocket = async (notificationData) => {
    const io = (0, socketConnection_1.getSocketIO)();
    await notification_model_1.default.create(notificationData);
    const updatedNotification = await (0, getUnseenNotificationCount_1.default)(notificationData.receiver.toString());
    io.to(notificationData.receiver.toString()).emit('notification', updatedNotification);
};
exports.sendNotificationBySocket = sendNotificationBySocket;
const sendPushNotification = async (fcmToken, data) => {
    try {
        const message = {
            notification: {
                title: data.title,
                body: data.content,
            },
            token: fcmToken,
            data: {
                time: data.time,
            },
        };
        const response = await firebase_config_1.default.messaging().send(message);
        return response;
    }
    catch (error) {
        throw new utils_1.AppError(http_status_1.default.NO_CONTENT, error instanceof Error ? error.message : String(error));
    }
};
exports.sendPushNotification = sendPushNotification;

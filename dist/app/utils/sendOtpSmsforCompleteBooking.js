"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twilio_1 = __importDefault(require("twilio"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("./AppError"));
const http_status_1 = __importDefault(require("http-status"));
const client = (0, twilio_1.default)(config_1.default.twilio.accountSid, config_1.default.twilio.authToken);
const sendOtpSmsForCompleteBooking = async (phoneNumber, otp) => {
    try {
        await client.messages.create({
            body: `This is booking completion OTP! share this otp with your Artist if you take any service from him. Your OTP is: ${otp}. It will expire in 5 minutes.`,
            from: config_1.default.twilio.phoneNumber,
            to: phoneNumber,
        });
    }
    catch (error) {
        let message = 'Failed to send OTP SMS';
        if (error instanceof Error) {
            message = error.message;
        }
        // eslint-disable-next-line no-console
        console.error('Twilio error:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, message);
    }
};
exports.default = sendOtpSmsForCompleteBooking;

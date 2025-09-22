import twilio from 'twilio';
import config from '../config';
import AppError from './AppError';
import httpStatus from 'http-status';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const sendOtpSmsForCompleteBooking = async (phoneNumber: string, otp: string) => {
  try {
    await client.messages.create({
      body: `This is booking completion OTP! share this otp with your Artist if you take any service from him. Your OTP is: ${otp}. It will expire in 5 minutes.`,
      from: config.twilio.phoneNumber,
      to: phoneNumber,
    });
  } catch (error: unknown) {
    let message = 'Failed to send OTP SMS';

    if (error instanceof Error) {
      message = error.message;
    }

    // eslint-disable-next-line no-console
    console.error('Twilio error:', error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, message);
  }
};

export default sendOtpSmsForCompleteBooking;

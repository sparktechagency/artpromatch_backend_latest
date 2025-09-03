import twilio from 'twilio';
import config from '../config';
import AppError from './AppError';
import status from 'http-status';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const sendOtpSms = async (phoneNumber: string, otp: string) => {
  try {
    await client.messages.create({
      body: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
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
    throw new AppError(status.INTERNAL_SERVER_ERROR, message);
  }
};

export default sendOtpSms;

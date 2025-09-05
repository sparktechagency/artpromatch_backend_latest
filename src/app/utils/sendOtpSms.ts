import twilio from 'twilio';
import config from '../config';
import AppError from './AppError';
import httpStatus from 'http-status';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const sendOtpSms = async (phoneNumber: string, otp: string) => {
  try {
    await client.messages.create({
      body: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      from: config.twilio.phoneNumber,
      to: phoneNumber,
    });
  } catch (error: any) {
  console.error('Twilio error:', error);
  throw new AppError(
    status.INTERNAL_SERVER_ERROR,
    error?.message || 'Failed to send OTP SMS'
  );
}
};

export default sendOtpSms;

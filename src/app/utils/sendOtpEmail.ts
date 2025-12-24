import httpStatus from 'http-status';
import nodemailer from 'nodemailer';
import config from '../config';
import AppError from './AppError';

const sendOtpEmail = async (
  email: string,
  otp: string,
  name: string,
  subject: string = 'Your OTP for Account Verification',
  customMessage: string = ''
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      // secure: config.NODE_ENV === 'production',
      auth: {
        user: config.nodemailer.email,
        pass: config.nodemailer.password,
      },
      // tls: {
      //   rejectUnauthorized: false, // ⚠️ Allow self-signed certs (only for development)
      // },
    });

    const logoUrl =
      'https://res.cloudinary.com/dqk9g25o1/image/upload/v1766495346/logo_snbn3g.png';

    const html = generateEmailHTML({ otp, name, logoUrl, customMessage });

    await transporter.sendMail({
      from: `Steady Hands <${config.nodemailer.email}>`,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Email send error:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send email'
    );
  }
};

// Email HTML generator
const generateEmailHTML = ({
  otp,
  name,
  logoUrl,
  customMessage = '',
}: {
  otp: string;
  name: string;
  logoUrl: string;
  customMessage?: string;
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 16px;
        }
        .header img {
          max-width: 140px;
          margin-bottom: 12px;
        }
        .otp {
          font-size: 24px;
          font-weight: bold;
          color: #816A6B;
          background: #fff8e1;
          padding: 12px;
          text-align: center;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #888;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Logo" />
          <h2>Welcome to Steady Hands</h2>
        </div>

        <p>Hello ${name},</p>
        <p>Your one-time password (OTP) is:</p>

        <div class="otp">${otp}</div>

        <p>This OTP will expire in 5 minutes.</p>

        ${customMessage ? `<p><strong>Note:</strong> ${customMessage}</p>` : ''}

        <div class="footer">
          <p>If you didn’t request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default sendOtpEmail;


/*
User; dlmichaeldean@gmail.com
Pass: Necromoogledl45!

*/
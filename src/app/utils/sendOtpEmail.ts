import httpStatus from 'http-status';
import nodemailer from 'nodemailer';
import config from '../config';
import AppError from './AppError';

type TSendOtpEmailOptions = {
  email: string;
  otp: string;
  name?: string;
  subject?: string;
  logoCid?: string;
  customMessage?: string;
  attachments?: { filename: string; path: string }[];
};

// Utility function to generate the email HTML content dynamically
const generateEmailHTML = (
  otp: string,
  name: string,
  logoCid: string,
  customMessage: string = ''
) => {
  return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
              }
              .header img {
                max-width: 150px;
                margin-bottom: 20px;
              }
              .header h2 {
                color: #816A6B; /* Steady Hands theme color */
              }
              .otp {
                font-size: 24px;
                font-weight: bold;
                color: #816A6B;
                padding: 12px;
                background-color: #fff8e1;
                border-left: 4px solid #816A6B;
                text-align: center;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #888888;
                padding-top: 20px;
                border-top: 2px solid #f0f0f0;
              }
              @media only screen and (max-width: 600px) {
                .container {
                  padding: 15px;
                }
                .otp {
                  font-size: 20px;
                  padding: 10px;
                }
                .footer {
                  font-size: 10px;
                }
                .header h2 {
                  font-size: 22px;
                }
              }
            </style>
          </head>
          <body>

            <div class="container">
              <div class="header">
                <img src="cid:${logoCid}" alt="Steady Hands Logo">
                <h2>Thank You for Joining Steady Hands!</h2>
                <p>We're excited to help you grow your studio.</p>
              </div>

              <p>Hello ${name},</p>
              <p>We received a request to verify your email address. Your one-time password (OTP) is:</p>

              <div class="otp">
                ${otp}
              </div>

              <p>Please enter this OTP to complete your email verification and start using Steady Hands to grow your studio.</p>
              <p><strong>Note:</strong> This OTP will expire in 5 minutes. Be sure to enter it before it expires.</p>

              ${
                customMessage
                  ? `<p><strong>Additional Info:</strong> ${customMessage}</p>`
                  : ''
              }

              <div class="footer">
                <p>Thank you for being a part of Steady Hands. If you did not request this, please ignore this email.</p>
              </div>
            </div>

          </body>
          </html>
  `;
};

const sendOtpEmail = async (
  emailOrOptions: string | TSendOtpEmailOptions,
  otpArg?: string,
  fullNameArg?: string
) => {
  try {
    // Backward-compatible options resolution
    const opts: TSendOtpEmailOptions =
      typeof emailOrOptions === 'string'
        ? {
            email: emailOrOptions,
            otp: otpArg as string,
            name: fullNameArg ?? 'User',
          }
        : emailOrOptions;

    const {
      email,
      otp,
      name = 'User',
      subject = 'Your OTP for Account Verification',
      logoCid = 'art_pro_match_logo',
      customMessage = '',
      attachments = [],
    } = opts;

    // Create a transporter for sending emails
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: config.nodemailer.email,
    //     pass: config.nodemailer.password,
    //   },

    //   // Ensure serverless does not hang indefinitely on blocked SMTP
    //   pool: true,
    //   maxConnections: 1,
    //   connectionTimeout: 5000, // ms
    //   greetingTimeout: 5000, // ms
    //   socketTimeout: 5000, // ms
    // });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.nodemailer.email,
        pass: config.nodemailer.password,
      },
      pool: true,
      maxConnections: 1,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    // Email HTML template with dynamic placeholders
    const htmlTemplate = generateEmailHTML(otp, name, logoCid, customMessage);

    // Email options: from, to, subject, and HTML body
    const siteName = 'Art Pro Match';
    const mailOptions: nodemailer.SendMailOptions = {
      from: `${siteName} 📰 <${config.nodemailer.email}>`,
      to: email,
      subject: subject,
      html: htmlTemplate,
      attachments: [
        ...attachments,
        ...[
          {
            filename: 'logo.png',
            path: 'https://res.cloudinary.com/dqk9g25o1/image/upload/v1766495346/logo_snbn3g.png',
            cid: logoCid,
          },
        ],
      ],
    };

    // Send the email using Nodemailer with an explicit safety timeout
    const SEND_TIMEOUT_MS = 8000;
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Email send timeout')),
          SEND_TIMEOUT_MS
        )
      ),
    ]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send email'
    );
  }
};

export default sendOtpEmail;

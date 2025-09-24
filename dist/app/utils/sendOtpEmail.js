"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("./AppError"));
const path_1 = __importDefault(require("path"));
const sendOtpEmail = async (email, otp, fullName) => {
    try {
        // Create a transporter for sending emails
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: config_1.default.nodemailer.email,
                pass: config_1.default.nodemailer.password,
            },
        });
        // Email HTML template with dynamic placeholders
        const htmlTemplate = `
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
                <img src="cid:steady_hands_logo" alt="Steady Hands Logo"> <!-- Ensure this is the correct logo path -->
                <h2>Thank You for Joining Steady Hands!</h2>
                <p>We're excited to help you grow your studio.</p>
              </div>

              <p>Hello ${fullName},</p>
              <p>We received a request to verify your email address. Your one-time password (OTP) is:</p>

              <div class="otp">
                ${otp}
              </div>

              <p>Please enter this OTP to complete your email verification and start using Steady Hands to grow your studio.</p>
              <p><strong>Note:</strong> This OTP will expire in 5 minutes. Be sure to enter it before it expires.</p>

              <div class="footer">
                <p>Thank you for being a part of Steady Hands. If you did not request this, please ignore this email.</p>
              </div>
            </div>

          </body>
          </html>
  `;
        // Email options: from, to, subject, and HTML body
        const mailOptions = {
            from: config_1.default.nodemailer.email, // Sender's email address
            to: email, // Recipient's email address
            subject: 'Your OTP for Account Verification',
            html: htmlTemplate,
            attachments: [
                {
                    filename: 'logo.png',
                    path: path_1.default.join(__dirname, 'assets', 'logo.png'),
                    cid: 'steady_hands_logo',
                },
            ],
        };
        // Send the email using Nodemailer
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to send email');
    }
};
exports.default = sendOtpEmail;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("./AppError"));
const sendContactUsEmail = async (payload) => {
    try {
        // Create a transporter for sending emails
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: config_1.default.nodemailer.email,
                pass: config_1.default.nodemailer.password,
            },
        });
        // Email HTML template with dynamic placeholders for contact message
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
          .header h2 {
            color: #FF6347;
          }
          .message {
            font-size: 16px;
            color: #333;
            padding: 12px;
            background-color: #f9f9f9;
            border-left: 4px solid #FF6347;
            text-align: left;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #888888;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
          }
        </style>
      </head>
      <body>

        <div class="container">
          <div class="header">
            <h2>You've Received a Message from Your Website</h2>
          </div>

          <p>Hello Admin,</p>
          <p>You have a new message from a user on your website's "Contact Us" page. Below are the details:</p>

          <p><strong>Full Name:</strong> ${payload.fullName}</p>
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Phone Number:</strong> ${payload.phoneNumber}</p>

          <div class="message">
            <strong>Message:</strong>
            <p>${payload.message}</p>
          </div>

          <div class="footer">
            <p>Thank you for your attention. If you have any questions or need assistance, feel free to reply to this email.</p>
          </div>
        </div>

      </body>
      </html>
    `;
        // Email options: from, to, subject, and HTML body
        const mailOptions = {
            from: config_1.default.nodemailer.email, // Sender's email address
            to: config_1.default.contact_us_email, // Admin's email address
            subject: `New Contact Us Message from ${payload.fullName}`,
            html: htmlTemplate,
        };
        // Send the email using Nodemailer
        await transporter.sendMail(mailOptions);
    }
    catch {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to send contact us message');
    }
};
exports.default = sendContactUsEmail;

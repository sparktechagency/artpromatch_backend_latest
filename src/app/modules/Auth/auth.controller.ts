import httpStatus from 'http-status';
import {
  asyncHandler,
  // options
} from '../../utils';
import { AuthService } from './auth.service';
// import { CookieOptions } from 'express';
import { TProfileFileFields } from '../../types';
import sendResponse from '../../utils/sendResponse';

// 1. createAuth
const createAuth = asyncHandler(async (req, res) => {
  const result = await AuthService.createAuth(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent successfully, verify your account in 5 minutes!',
    data: result,
  });
});

// 2. sendSignupOtpAgain
const sendSignupOtpAgain = asyncHandler(async (req, res) => {
  const userEmail = req.body.userEmail;
  const result = await AuthService.sendSignupOtpAgain(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent again successfully, verify in 5 minutes!',
    data: result,
  });
});

// 3. verifySignupOtp
const verifySignupOtp = asyncHandler(async (req, res) => {
  const userEmail = req.body.userEmail;
  const otp = req.body.otp;
  const result = await AuthService.verifySignupOtpIntoDB(userEmail, otp);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'OTP verified successfully!',
    data: result,
  });
});

// 4. signin
const signin = asyncHandler(async (req, res) => {
  const result = await AuthService.signinIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Signin successful!',
    data: result,
  });
});

// 5. createProfile
const createProfile = asyncHandler(async (req, res) => {
  const body = req.body;
  const user = req.user;
  const files = (req.files as TProfileFileFields) || {};
  const result = await AuthService.createProfileIntoDB(body, user, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Applied for the profile, have patience for Admin approval!',
    data: result,
  });
});

// // clientCreateProfile
// const clientCreateProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const result = await AuthService.clientCreateProfileIntoDB(body, user);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// // artistCreateProfile
// const artistCreateProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const files = (req.files as TProfileFileFields) || {};
//   const result = await AuthService.artistCreateProfileIntoDB(body, user, files);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// // businessCreateProfile
// const businessCreateProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const files = (req.files as TProfileFileFields) || {};
//   const result = await AuthService.businessCreateProfileIntoDB(
//     body,
//     user,
//     files
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// 6. socialSignin
const socialSignin = asyncHandler(async (req, res) => {
  const { response, accessToken, refreshToken } =
    await AuthService.socialLoginServices(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Signin successful!',
    data: { response, accessToken, refreshToken },
  });
});

// 7. updateProfilePhoto
const updateProfilePhoto = asyncHandler(async (req, res) => {
  const result = await AuthService.updateProfilePhotoIntoDB(req.user, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Photo updated successfully!',
    data: result,
  });
});

// 8. changePassword
const changePassword = asyncHandler(async (req, res) => {
  const accessToken =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies.accessToken;
  const result = await AuthService.changePasswordIntoDB(accessToken, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed successfully!',
    data: result,
  });
});

// forgetPassword
const forgetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const result = await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message:
      'Your OTP has been successfully sent to your email. If you do not find the email in your inbox, please check your spam or junk folder!',
    data: result,
  });
});

// verifyOtpForForgetPassword
const verifyOtpForForgetPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.verifyOtpForForgetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully!',
    data: result,
  });
});

// resetPassword
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies?.resetPasswordToken;
  const result = await AuthService.resetPasswordIntoDB(
    resetPasswordToken,
    req.body.newPassword
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Reset password successfully!',
    data: result,
  });
});

// fetchProfile
const fetchProfile = asyncHandler(async (req, res) => {
  const result = await AuthService.fetchProfileFromDB(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile data retrieved successfully!',
    data: result,
  });
});

// fetchClientConnectedAccount
const fetchClientConnectedAccount = asyncHandler(async (req, res) => {
  const result = await AuthService.fetchAllConnectedAcount(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Discover artists retrieved successfully!',
    data: result,
  });
});

// deactivateUserAccount
const deactivateUserAccount = asyncHandler(async (req, res) => {
  const result = await AuthService.deactiveUserCurrentAccount(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Account Deactivate successfully!',
    data: result,
  });
});

// deleteSpecificAccount
const deleteSpecificAccount = asyncHandler(async (req, res) => {
  const result = await AuthService.deleteUserAccount(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Account Deleted successfully!',
    data: result,
  });
});

export const AuthController = {
  createAuth,
  sendSignupOtpAgain,
  verifySignupOtp,
  signin,
  createProfile,
  // clientCreateProfile,
  // artistCreateProfile,
  // businessCreateProfile,
  socialSignin,
  updateProfilePhoto,
  changePassword,
  forgetPassword,
  verifyOtpForForgetPassword,
  resetPassword,
  fetchProfile,
  fetchClientConnectedAccount,
  deactivateUserAccount,
  deleteSpecificAccount,
};

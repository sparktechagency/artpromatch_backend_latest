import httpStatus from 'http-status';
import { AppError, AppResponse, asyncHandler, options } from '../../utils';
import { AuthService } from './auth.service';
import { CookieOptions } from 'express';
import { TProfileFileFields } from '../../types';

const createAuth = asyncHandler(async (req, res) => {
  const result = await AuthService.createAuth(req.body);
  console.log(result);
  res
    .status(httpStatus.OK)
    .json(new AppResponse(httpStatus.OK, result, 'OTP send successfully'));
});

const signupOtpSendAgain = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access!');
  }

  const result = await AuthService.signupOtpSendAgain(token);

  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(httpStatus.OK, result, 'OTP send again successfully')
    );
});

const saveAuthData = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || '';
  const otp = req.body.otp;
  const result = await AuthService.saveAuthIntoDB(token, otp);
  console.log(result);
  res
    .status(httpStatus.CREATED)
    .cookie('accessToken', result.accessToken, options as CookieOptions)
    .cookie('refreshToken', result.refreshToken, options as CookieOptions)
    .json(
      new AppResponse(
        httpStatus.CREATED,
        { accessToken: result.accessToken },
        'OTP verified successfully'
      )
    );
});

const createProfile = asyncHandler(async (req, res) => {
  const files = (req.files as TProfileFileFields) || {};
  const user = req.user;
  const result = await AuthService.saveProfileIntoDB(req.body, user, files);
  res
    .status(httpStatus.CREATED)
    .json(
      new AppResponse(
        httpStatus.CREATED,
        result,
        'Account created successfully'
      )
    );
});

const signin = asyncHandler(async (req, res) => {
  const result = await AuthService.signinIntoDB(req.body);

  res
    .status(httpStatus.OK)
    .cookie('accessToken', result.accessToken, options as CookieOptions)
    .cookie('refreshToken', result.refreshToken, options as CookieOptions)
    .json(new AppResponse(httpStatus.OK, result, 'Signin successfully'));
});

const socialSignin = asyncHandler(async (req, res) => {
  const { response, accessToken, refreshToken } =
    await AuthService.socialLoginServices(req.body);

  console.log({ accessToken, refreshToken });

  res
    .status(httpStatus.OK)
    .cookie('accessToken', accessToken, options as CookieOptions)
    .cookie('refreshToken', refreshToken, options as CookieOptions)
    .json(new AppResponse(httpStatus.OK, response, 'Signin successfully'));
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
  const result = await AuthService.updateProfilePhoto(req.user, req.file);

  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(
        httpStatus.OK,
        result,
        'Profile photo update successfully'
      )
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const accessToken =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies.accessToken;
  console.log('accessToken', accessToken);
  const result = await AuthService.changePasswordIntoDB(accessToken, req.body);
  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(httpStatus.OK, result, 'Password change successfully')
    );
});

// For forget password
const forgetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email;

  const result = await AuthService.forgotPassword(email);

  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(
        httpStatus.OK,
        result,
        'Your OTP has been successfully sent to your email. If you do not find the email in your inbox, please check your spam or junk folder.'
      )
    );
});

const verifyOtpForForgetPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.verifyOtpForForgetPassword(req.body);

  res
    .status(httpStatus.OK)
    .json(new AppResponse(httpStatus.OK, result, 'OTP verified successfully'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies?.resetPasswordToken;
  const result = await AuthService.resetPasswordIntoDB(
    resetPasswordToken,
    req.body.newPassword
  );

  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(httpStatus.OK, result, 'Reset password successfully')
    );
});

const fetchProfile = asyncHandler(async (req, res) => {
  console.log(req.body);
  const result = await AuthService.fetchProfileFromDB(req.user);

  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(
        httpStatus.OK,
        result,
        'Profile data retrieved successfully'
      )
    );
});

const fetchClientConnectedAccount = asyncHandler(async (req, res) => {
  console.log(req.user);
  const result = await AuthService.fetchAllConnectedAcount(req.user);

  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(
        httpStatus.OK,
        result,
        'Discover artists retrieved successfully'
      )
    );
});

const deactivateUserAccount = asyncHandler(async (req, res) => {
  const result = await AuthService.deactiveUserCurrentAccount(
    req.user,
    req.body
  );
  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(httpStatus.OK, result, 'Account Deactivate successfully!')
    );
});

const deleteSpecificAccount = asyncHandler(async (req, res) => {
  const result = await AuthService.deleteUserAccount(req.user);
  res
    .status(httpStatus.OK)
    .json(
      new AppResponse(httpStatus.OK, result, 'Account Deleted successfully!')
    );
});

export const AuthController = {
  createAuth,
  saveAuthData,
  signupOtpSendAgain,
  createProfile,
  signin,
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

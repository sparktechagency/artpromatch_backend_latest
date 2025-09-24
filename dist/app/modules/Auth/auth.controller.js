"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const auth_service_1 = require("./auth.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// 1. createAuth
const createAuth = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.createAuthIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'OTP sent successfully, verify your account in 5 minutes!',
        data: result,
    });
});
// 2. sendSignupOtpAgain
const sendSignupOtpAgain = (0, utils_1.asyncHandler)(async (req, res) => {
    const userEmail = req.body.userEmail;
    const result = await auth_service_1.AuthService.sendSignupOtpAgain(userEmail);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'OTP sent again successfully, verify in 5 minutes!',
        data: result,
    });
});
// 3. verifySignupOtp
const verifySignupOtp = (0, utils_1.asyncHandler)(async (req, res) => {
    const userEmail = req.body.userEmail;
    const otp = req.body.otp;
    const result = await auth_service_1.AuthService.verifySignupOtpIntoDB(userEmail, otp);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'OTP verified successfully!',
        data: result,
    });
});
// 4. signin
const signin = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.signinIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Signin successful!',
        data: result,
    });
});
// 5. createProfile
const createProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const body = req.body;
    const user = req.user;
    const files = req.files || {};
    const result = await auth_service_1.AuthService.createProfileIntoDB(body, user, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
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
const socialSignin = (0, utils_1.asyncHandler)(async (req, res) => {
    const { response, accessToken, refreshToken } = await auth_service_1.AuthService.socialLoginServices(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Signin successful!',
        data: { response, accessToken, refreshToken },
    });
});
// 7. updateProfilePhoto
const updateProfilePhoto = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.updateProfilePhotoIntoDB(req.user, req.file);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Photo updated successfully!',
        data: result,
    });
});
// 8. changePassword
const changePassword = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.changePasswordIntoDB(req.body, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Password changed successfully!',
        data: result,
    });
});
// 9. forgetPassword
const forgetPassword = (0, utils_1.asyncHandler)(async (req, res) => {
    const email = req.body.email;
    const result = await auth_service_1.AuthService.forgotPassword(email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Your OTP has been successfully sent to your email. If you do not find the email in your inbox, please check your spam or junk folder!',
        data: result,
    });
});
// 10. verifyOtpForForgetPassword
const verifyOtpForForgetPassword = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.verifyOtpForForgetPassword(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'OTP verified successfully!',
        data: result,
    });
});
// 11. resetPassword
const resetPassword = (0, utils_1.asyncHandler)(async (req, res) => {
    const resetPasswordToken = req.header('Authorization')?.replace('Bearer ', '') ||
        req.cookies?.resetPasswordToken;
    const result = await auth_service_1.AuthService.resetPasswordIntoDB(resetPasswordToken, req.body.newPassword);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Password has been reset successfully!',
        data: result,
    });
});
// 12. fetchProfile
const fetchProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.fetchProfileFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Profile data retrieved successfully!',
        data: result,
    });
});
// 13. fetchClientConnectedAccount
const fetchClientConnectedAccount = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.fetchAllConnectedAcount(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Discover artists retrieved successfully!',
        data: result,
    });
});
// 14. deactivateUserAccount
const deactivateUserAccount = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.deactivateUserAccountFromDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Account Deactivate successfully!',
        data: result,
    });
});
// 15. deleteSpecificAccount
const deleteSpecificUserAccount = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.deleteSpecificUserAccount(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Account Deleted successfully!',
        data: result,
    });
});
// 16. getNewAccessToken
const getNewAccessToken = (0, utils_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    if (!refreshToken) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Refresh token is required!');
    }
    const result = await auth_service_1.AuthService.getNewAccessTokenFromServer(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Access token given successfully!',
        data: result,
    });
});
// 17. updateAuthData
const updateAuthData = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.updateAuthDataIntoDB(req.body, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Data updated successfully!',
        data: result,
    });
});
exports.AuthController = {
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
    deleteSpecificUserAccount,
    getNewAccessToken,
    updateAuthData,
};

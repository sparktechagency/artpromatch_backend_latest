"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const middlewares_1 = require("../../middlewares");
const auth_validation_1 = require("./auth.validation");
const auth_controller_1 = require("./auth.controller");
const lib_1 = require("../../lib");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_constant_1 = require("./auth.constant");
const router = (0, express_1.Router)();
// 1. createAuth
router
    .route('/signup')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.createAuthSchema), auth_controller_1.AuthController.createAuth);
// 2. sendSignupOtpAgain
router
    .route('/send-signup-otp-again')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.sendSignupOtpAgainSchema), auth_controller_1.AuthController.sendSignupOtpAgain);
// 3. verifySignupOtp
router
    .route('/verify-signup-otp')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.verifySignupOtpSchema), auth_controller_1.AuthController.verifySignupOtp);
// 4. signin
router
    .route('/signin')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.signinSchema), auth_controller_1.AuthController.signin);
// 5. createProfile
router.route('/create-Profile').post(lib_1.upload.fields([
    { name: 'idFrontPart', maxCount: 1 },
    { name: 'idBackPart', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 },
    { name: 'registrationCertificate', maxCount: 1 },
    { name: 'taxIdOrEquivalent', maxCount: 1 },
    { name: 'studioLicense', maxCount: 1 },
]), (0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS), (0, validateRequest_1.validateRequestFromFormData)(auth_validation_1.AuthValidation.createProfileSchema), auth_controller_1.AuthController.createProfile);
// // clientCreateProfile
// router.route('/client-create-Profile').post(
//   auth(ROLE.CLIENT),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.clientCreateProfile
// );
// // artistCreateProfile
// router.route('/artist-create-Profile').post(
//   upload.fields([
//     { name: 'idFrontPart', maxCount: 1 },
//     { name: 'idBackPart', maxCount: 1 },
//     { name: 'selfieWithId', maxCount: 1 },
//   ]),
//   auth(ROLE.CLIENT),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.artistCreateProfile
// );
// // businessCreateProfile
// router.route('/business-create-Profile').post(
//   upload.fields([
//     { name: 'registrationCertificate', maxCount: 1 },
//     { name: 'taxIdOrEquivalent', maxCount: 1 },
//     { name: 'studioLicense', maxCount: 1 },
//   ]),
//   auth(ROLE.CLIENT, ROLE.ARTIST),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.businessCreateProfile
// );
// 6. socialSignin
router
    .route('/social-signin')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.socialSigninSchema), auth_controller_1.AuthController.socialSignin);
// 7. updateProfilePhoto
router
    .route('/update-profile-photo')
    .put((0, middlewares_1.auth)(), lib_1.upload.single('file'), auth_controller_1.AuthController.updateProfilePhoto);
// 8. changePassword
router.route('/change-password').patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS, auth_constant_1.ROLE.ADMIN, auth_constant_1.ROLE.SUPER_ADMIN), 
// validateRequest(AuthValidation.changePasswordSchema),
auth_controller_1.AuthController.changePassword);
// 9. forgetPassword
router
    .route('/forget-password')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.forgetPasswordSchema), auth_controller_1.AuthController.forgetPassword);
// 10. verifyOtpForForgetPassword
router
    .route('/verify-forget-password')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.verifyOtpForForgetPasswordSchema), auth_controller_1.AuthController.verifyOtpForForgetPassword);
// 11. resetPassword
router
    .route('/reset-password')
    .post((0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.resetPasswordSchema), auth_controller_1.AuthController.resetPassword);
// 12. fetchProfile
router.route('/profile').get((0, middlewares_1.auth)(), auth_controller_1.AuthController.fetchProfile);
// 13. fetchClientConnectedAccount
router
    .route('/connected-account')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS), auth_controller_1.AuthController.fetchClientConnectedAccount);
// 14. deactivateUserAccount
router
    .route('/deactive-account')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.deactivateUserAccountSchema), auth_controller_1.AuthController.deactivateUserAccount);
// 15. deleteSpecificUserAccount
router
    .route('/delete-account')
    .delete((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS), auth_controller_1.AuthController.deleteSpecificUserAccount);
// 16. getNewAccessToken
router.route('/access-token').get(auth_controller_1.AuthController.getNewAccessToken);
// 17. updateAuthData
router
    .route('/update-auth-data')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(auth_validation_1.AuthValidation.updateAuthDataSchema), auth_controller_1.AuthController.updateAuthData);
exports.AuthRoutes = router;

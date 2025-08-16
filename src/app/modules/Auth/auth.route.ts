import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';
import { upload } from '../../lib';
import { validateRequestFromFormData } from '../../middlewares/validateRequest';
import { ROLE } from './auth.constant';

const router = Router();

router
  .route('/signup')
  .post(
    validateRequest(AuthValidation.createSchema),
    AuthController.createAuth
  );

router
  .route('/signin')
  .post(validateRequest(AuthValidation.signinSchema), AuthController.signin);

router.route('/verify-signup-otp').post(AuthController.saveAuthData);

router
  .route('/verify-signup-otp-again')
  .post(AuthController.signupOtpSendAgain);

router.route('/create-profile').post(
  upload.fields([
    { name: 'idFrontPart', maxCount: 1 },
    { name: 'idBackPart', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 },
    { name: 'registrationCertificate', maxCount: 1 },
    { name: 'taxIdOrEquivalent', maxCount: 1 },
    { name: 'studioLicense', maxCount: 1 },
  ]),
  auth(),
  validateRequestFromFormData(AuthValidation.profileSchema),
  AuthController.createProfile
);

router
  .route('/social-signin')
  .post(
    validateRequest(AuthValidation.socialSchema),
    AuthController.socialSignin
  );

router
  .route('/connected-account')
  .get(
    auth(ROLE.CLIENT,ROLE.ARTIST,ROLE.BUSINESS),
    AuthController.fetchClientConnectedAccount
  );

router
  .route('/change-password')
  .patch(
    auth(),
    validateRequest(AuthValidation.passwordChangeSchema),
    AuthController.changePassword
  );

// For forget password
router
  .route('/forget-password')
  .post(
    validateRequest(AuthValidation.forgetPasswordSchema),
    AuthController.forgetPassword
  );

router
  .route('/forget-password-verify')
  .post(
    auth(ROLE.CLIENT,ROLE.ARTIST,ROLE.BUSINESS),
    validateRequest(AuthValidation.forgetPasswordVerifySchema),
    AuthController.verifyOtpForForgetPassword
  );

router
  .route('/reset-password')
  .post(
    validateRequest(AuthValidation.resetPasswordSchema),
    AuthController.resetPassword
  );


router
  .route('/deactive-account')
  .post(
    auth(ROLE.CLIENT,ROLE.ARTIST,ROLE.BUSINESS),
    validateRequest(AuthValidation.userDeactivationSchema),
    AuthController.deactivateUserAccount
  );

router
  .route('/profile-image')
  .put(auth(), upload.single('file'), AuthController.updateProfilePhoto);

router.route('/profile').get(auth(), AuthController.fetchProfile);

export const AuthRoutes = router;

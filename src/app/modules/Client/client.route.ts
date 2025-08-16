import { Router } from 'express';
import { ClientController } from './client.controller';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { ClientValidation } from './client.validation';

const router = Router();

router
  .route('/personal-info')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.profileInfoSchema),
    ClientController.updateProfile
  );

router
  .route('/preferences')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.preferencesSchema),
    ClientController.updatePreferences
  );

router
  .route('/notification-preferences')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.notificationSchema),
    ClientController.updateNotificationPreferences
  );



router
  .route('/privacy-security')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.privacySecuritySchema),
    ClientController.updatePrivacySecuritySettings
  );

router.route('/discover').get(auth(), ClientController.fetchDiscoverArtists);

export const ClientRoutes = router;

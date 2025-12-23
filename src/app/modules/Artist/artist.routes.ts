import { Router } from 'express';
import { ArtistController } from './artist.controller';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { ArtistValidation } from './artist.validation';
import { upload } from '../../lib';
import { SlotValidation } from '../../schema/slotValidation';
import { ArtistServiceValidation } from '../Service/service.zod';
import { validateRequestFromFormData } from '../../middlewares/validateRequest';

const router = Router();

// getAllArtists
router.route('/').get(auth(ROLE.ARTIST, ROLE.BUSINESS), ArtistController.getAllArtists);

// getOwnArtistData
router.route('/own').get(auth(ROLE.ARTIST), ArtistController.getOwnArtistData);

// getSingleArtist
router
  .route('/single/:id')
  .get(auth(ROLE.CLIENT, ROLE.ARTIST), ArtistController.getSingleArtist);

// updateArtistPersonalInfo
router
  .route('/')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.updateSchema),
    ArtistController.updateArtistPersonalInfo
  );

// updateArtistProfile
router
  .route('/profile')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistProfileSchema),
    ArtistController.updateArtistProfile
  );

// updateArtistPreferences
router
  .route('/preferences')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistPreferencesSchema),
    ArtistController.updateArtistPreferences
  );

// updateArtistNotificationPreferences
router
  .route('/notification-preferences')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistNotificationSchema),
    ArtistController.updateArtistNotificationPreferences
  );

// updateArtistPrivacySecuritySettings
router
  .route('/privacy-security')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistPrivacySecuritySchema),
    ArtistController.updateArtistPrivacySecuritySettings
  );

// updateArtistFlashes
router
  .route('/flashes')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    ArtistController.updateArtistFlashes
  );

// updateArtistPortfolio
router
  .route('/portfolio')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    ArtistController.updateArtistPortfolio
  );

// createArtistService
router.route('/service/create').post(
  auth(ROLE.ARTIST),
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validateRequestFromFormData(ArtistServiceValidation.createServiceSchema),
  ArtistController.createArtistService
);

router.route('/service/details/:id').get(
  auth(ROLE.ARTIST),
  ArtistController.getArtistServiceDetails
);

// getArtistDashboardPage
router
  .route('/dashboard')
  .get(auth(ROLE.ARTIST), ArtistController.getArtistDashboardPage);

// getServicesByArtist
router
  .route('/services')
  .get(auth(ROLE.ARTIST), ArtistController.getServicesByArtist);

// updateArtistService
router.route('/service/update/:id').patch(
  auth(ROLE.ARTIST),
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validateRequestFromFormData(ArtistServiceValidation.updateServiceSchema),
  ArtistController.updateArtistServiceById
);

// deleteArtistService
router
  .route('/service/delete/:id')
  .delete(auth(ROLE.ARTIST), ArtistController.deleteArtistService);

// removeImage
router
  .route('/remove-image')
  .delete(auth(ROLE.ARTIST), ArtistController.removeImage);

// saveArtistAvailability
router
  .route('/availability')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(SlotValidation.availabilitySchema),
    ArtistController.saveArtistAvailability
  );

// getArtistSchedule
router
  .route('/schedule')
  .get(auth(ROLE.ARTIST), ArtistController.getArtistSchedule);

// boostProfile
router
  .route('/boost-profile')
  .post(auth(ROLE.ARTIST), ArtistController.boostProfile);

// confirmBoostPayment
router
  .route('/boost-profile/:sessionId')
  .patch(auth(ROLE.ARTIST), ArtistController.confirmBoostPayment);

// getArtistProfileByHisId
router
  .route('/profile/:Id')
  .get(auth(), ArtistController.getArtistProfileByHisId);

// getAvailabilityExcludingTimeOff
// router
//   .route('/availability/:id')
//   .get(ArtistController.getAvailabilityExcludingTimeOff)

// setArtistTimeOff
router
  .route('/days-off')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.setOffDaysSchema),
    ArtistController.setArtistTimeOff
  );

// createConnectedAccountAndOnboardingLinkForArtist
router
  .route('/create-onboarding-account')
  .post(
    auth(ROLE.ARTIST),
    ArtistController.createConnectedAccountAndOnboardingLinkForArtist
  );

// deleteAccount
router.route('/delete-account').post(ArtistController.deleteAccount);

export const ArtistRoutes = router;

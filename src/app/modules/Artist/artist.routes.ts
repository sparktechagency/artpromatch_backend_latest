import { Router } from 'express';
import { ArtistController } from './artist.controller';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { ArtistValidation } from './artist.validation';
import { upload } from '../../lib';
import { SlotValidation } from '../../schema/slotValidation';

const router = Router();

// Route for updating artist profile
router
  .route('/')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.updateSchema),
    ArtistController.updateArtistPersonalInfo
  )
  .get(ArtistController.fetchAllArtists);

router
  .route('/profile')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistProfileSchema),
    ArtistController.updateProfile
  );

// Route for updating artist preferences
router
  .route('/preferences')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistPreferencesSchema),
    ArtistController.updatePreferences
  );

// Route for updating artist notification preferences
router
  .route('/notification-preferences')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistNotificationSchema),
    ArtistController.updateNotificationPreferences
  );

// Route for updating artist privacy and security settings
router
  .route('/privacy-security')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.artistPrivacySecuritySchema),
    ArtistController.updatePrivacySecuritySettings
  );

router
  .route('/flashes')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    ArtistController.updateArtistFlashes
  );

router
  .route('/portfolio')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    ArtistController.updateArtistPortfolio
  );

router
  .route('/remove-image')
  .delete(auth(ROLE.ARTIST), ArtistController.removeImage);

router
  .route('/availability')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(SlotValidation.availabilitySchema),
    ArtistController.saveAvailability
  );

// Route to manage artist's weekly availability
// router
//   .route('/availability/:id')
//   .get(ArtistController.getAvailabilityExcludingTimeOff)

// Route to manage artist's manually booked hours
router
  .route('/time-off')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(ArtistValidation.timeOffSchema),
    ArtistController.updateTimeOff
  );

router
  .route('/create-onboarding-account')
  .post(
    auth(ROLE.ARTIST),
    ArtistController.createConnectedAccountAndOnboardingLinkForArtist
  );

export const ArtistRoutes = router;

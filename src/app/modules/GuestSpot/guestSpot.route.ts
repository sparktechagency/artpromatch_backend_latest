import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { GuestSpotValidation } from './guestSpot.validation';
import { GuestSpotController } from './guestSpot.controller';

const router = Router();

// createGuestSpot
router
  .route('/')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(GuestSpotValidation.createGuestSpotSchema),
    GuestSpotController.createGuestSpot
  );

// updateGuestSpot
router
  .route('/:guestSpotId')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(GuestSpotValidation.updateGuestSpotSchema),
    GuestSpotController.updateGuestSpot
  );

export const GuestSpotRoutes = router;

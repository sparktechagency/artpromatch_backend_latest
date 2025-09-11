import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { BookingController } from './booking.controller';
import { BookingValidation } from './booking.validation';

const router = Router();

// router
//   .route('/create')
//   .post(
//     auth(ROLE.CLIENT),
//     validateRequest(BookingValidation.bookingSchema),
//     BookingController.createBooking
//   );

router
  .route('/review')
  .post(
    auth(ROLE.CLIENT),
    validateRequest(BookingValidation.bookingSchema),
    BookingController.ReviewAfterAServiceIsCompleted
  );

router
  .route('/get-availability')
  .post(
    auth(ROLE.CLIENT),
    validateRequest(BookingValidation.getAvailabilitySchema),
    BookingController.getAvailability
  );

export const BookingRoutes = router;

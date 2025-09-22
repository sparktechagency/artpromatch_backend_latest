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
  .route('/create')
  .post(
    auth(ROLE.CLIENT),
    validateRequest(BookingValidation.createBookingSchema),
    BookingController.createBooking
  );

router
  .route('/list')
  .get(
    auth(ROLE.CLIENT, ROLE.ARTIST),
    BookingController.getUserBookings
  );

router
  .route('/confirm/:bookingId')
  .post(auth(ROLE.ARTIST), BookingController.confirmBooking);

router
  .route('/cancel/:bookingId')
  .post(auth(ROLE.ARTIST,ROLE.CLIENT), BookingController.cancelBooking);

router
  .route('/add-session/:bookingId')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(BookingValidation.createSessionSchema),
    BookingController.createSession
  );

  router
  .route('/complete-session/:bookingId')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(BookingValidation.completeSessionSchema),
    BookingController.completeSession
  );

    router
  .route('/delete-session/:bookingId')
  .delete(
    auth(ROLE.ARTIST),
    BookingController.deleteSession
  );

router
  .route('/create')
  .post(
    auth(ROLE.CLIENT),
    validateRequest(BookingValidation.createBookingSchema),
    BookingController.createBooking
  );

// router
//   .route('/get-availability')
//   .post(
//     auth(ROLE.CLIENT),
//     validateRequest(BookingValidation.getAvailabilitySchema),
//     BookingController.getAvailability
//   );

export const BookingRoutes = router;

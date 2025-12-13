import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { BookingController } from './booking.controller';
import { BookingValidation } from './booking.validation';

const router = Router();

// reviewAfterAServiceIsCompleted
router
  .route('/review')
  .post(
    auth(ROLE.CLIENT),
    validateRequest(BookingValidation.reviewAfterAServiceIsCompletedSchema),
    BookingController.reviewAfterAServiceIsCompleted
  );

// createBooking
router
  .route('/create')
  .post(
    auth(ROLE.CLIENT),
    validateRequest(BookingValidation.createBookingSchema),
    BookingController.createBooking
  );

// getUserBookings
router
  .route('/list')
  .get(auth(ROLE.CLIENT, ROLE.ARTIST), BookingController.getUserBookings);

// confirmPaymentByClient

// confirmBookingByArtist
router
  .route('/confirm/:bookingId')
  .post(auth(ROLE.ARTIST), BookingController.confirmBookingByArtist);

// cancelBooking
router
  .route('/cancel/:bookingId')
  .post(auth(ROLE.ARTIST, ROLE.CLIENT), BookingController.cancelBooking);

// createSession
router
  .route('/add-session/:bookingId')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(BookingValidation.createSessionSchema),
    BookingController.createSession
  );

// completeSession
router
  .route('/complete-session/:bookingId')
  .post(
    auth(ROLE.ARTIST),
    validateRequest(BookingValidation.completeSessionSchema),
    BookingController.completeSession
  );

// artistMarksCompleted
router
  .route('/mark-as-completed/:bookingId')
  .post(auth(ROLE.ARTIST), BookingController.artistMarksCompleted);

// resendBookingOtp
router
  .route('/resend-booking-otp/:bookingId')
  .post(auth(ROLE.ARTIST), BookingController.resendBookingOtp);

// completeBooking
router
  .route('/complete/:bookingId')
  .post(auth(ROLE.ARTIST), BookingController.completeBooking);

// deleteSession
router
  .route('/delete-session/:bookingId')
  .delete(auth(ROLE.ARTIST), BookingController.deleteSession);

// repayBooking
// router
//   .route('/repay/:bookingId')
//   .post(auth(ROLE.CLIENT), BookingController.repayBooking);

// getBookingsWithReviewThatHaveReviewForClientHomePage
router
  .route('/bookings-with-review')
  .get(BookingController.getBookingsWithReviewThatHaveReviewForClientHomePage);

// router
//   .route('/get-availability')
//   .post(
//     auth(ROLE.CLIENT),
//     validateRequest(BookingValidation.getAvailabilitySchema),
//     BookingController.getAvailability
//   );

export const BookingRoutes = router;

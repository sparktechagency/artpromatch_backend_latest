"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRoutes = void 0;
const express_1 = require("express");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const booking_controller_1 = require("./booking.controller");
const booking_validation_1 = require("./booking.validation");
const router = (0, express_1.Router)();
// router
//   .route('/create')
//   .post(
//     auth(ROLE.CLIENT),
//     validateRequest(BookingValidation.bookingSchema),
//     BookingController.createBooking
//   );
router
    .route('/review')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(booking_validation_1.BookingValidation.bookingSchema), booking_controller_1.BookingController.ReviewAfterAServiceIsCompleted);
router
    .route('/create')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(booking_validation_1.BookingValidation.createBookingSchema), booking_controller_1.BookingController.createBooking);
// getUserBookings
router
    .route('/list')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST), booking_controller_1.BookingController.getUserBookings);
router
    .route('/confirm-payment')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), booking_controller_1.BookingController.confirmPaymentByClient);
router
    .route('/confirm/:bookingId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), booking_controller_1.BookingController.confirmBookingByArtist);
router
    .route('/cancel/:bookingId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT), booking_controller_1.BookingController.cancelBooking);
router
    .route('/add-session/:bookingId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(booking_validation_1.BookingValidation.createSessionSchema), booking_controller_1.BookingController.createSession);
router
    .route('/complete-session/:bookingId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(booking_validation_1.BookingValidation.completeSessionSchema), booking_controller_1.BookingController.completeSession);
router
    .route('/mark-as-completed/:bookingId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), booking_controller_1.BookingController.artistMarksCompleted);
router
    .route('/complete/:bookingId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), booking_controller_1.BookingController.completeBooking);
router
    .route('/delete-session/:bookingId')
    .delete((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), booking_controller_1.BookingController.deleteSession);
router
    .route('/create')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(booking_validation_1.BookingValidation.createBookingSchema), booking_controller_1.BookingController.createBooking);
// router
//   .route('/get-availability')
//   .post(
//     auth(ROLE.CLIENT),
//     validateRequest(BookingValidation.getAvailabilitySchema),
//     BookingController.getAvailability
//   );
exports.BookingRoutes = router;

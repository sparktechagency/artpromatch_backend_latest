"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const booking_service_1 = require("./booking.service");
// create booking
const createBooking = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await booking_service_1.BookingService.createBookingIntoDB(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Booking Created Successfully, pay now!',
        data: result,
    });
});
// confirm payment by client
const confirmPaymentByClient = (0, utils_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const result = await booking_service_1.BookingService.confirmPaymentByClient(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Payment successfull!',
        data: result,
    });
});
// repay booking
const repayBooking = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await booking_service_1.BookingService.repayBookingIntoDb(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Payment successfull!',
        data: result,
    });
});
// get user bookings
const getUserBookings = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await booking_service_1.BookingService.getUserBookings(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Booking retrieve Successfully!',
        data: result,
    });
});
// create session
const createSession = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const result = await booking_service_1.BookingService.createOrUpdateSessionIntoDB(bookingId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Session Created Successfully!',
        data: result,
    });
});
// get artist schedule
const getArtistSchedule = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await booking_service_1.BookingService.getArtistDailySchedule(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Schedule retrieved Successfully!',
        data: result,
    });
});
// complete session
const completeSession = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const { sessionId } = req.body;
    const result = await booking_service_1.BookingService.completeSessionByArtist(bookingId, sessionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Session Created Successfully!',
        data: result,
    });
});
// artist marks as completed
const artistMarksCompleted = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const result = await booking_service_1.BookingService.artistMarksCompletedIntoDb(req.user, bookingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'otp is sent your customer phone or email.please take that otp from him to complete the booking!',
        data: result,
    });
});
// complete booking
const completeBooking = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const otp = req.body.otp;
    if (!otp)
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'otp is required');
    if (!bookingId)
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'booking id is required');
    const result = await booking_service_1.BookingService.completeBookingIntoDb(req.user, bookingId, otp);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Congratulations! Booking Completed Successfully! money is transferred your account. stripe will pay it after 7 days',
        data: result,
    });
});
// delete session
const deleteSession = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const result = await booking_service_1.BookingService.deleteSessionFromBooking(bookingId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Session Created Successfully!',
        data: result,
    });
});
// confirm booking
const confirmBookingByArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const result = await booking_service_1.BookingService.confirmBookingByArtist(bookingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Booking confirmed Successfully!',
        data: result,
    });
});
// cancel booking
const cancelBooking = (0, utils_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const role = req.user.role;
    if (!['ARTIST', 'CLIENT'].includes(role))
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'this is not valid role');
    const result = await booking_service_1.BookingService.cancelBookingIntoDb(bookingId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'booking cancel Successfully!',
        data: result,
    });
});
// review
const ReviewAfterAServiceIsCompleted = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await booking_service_1.BookingService.ReviewAfterAServiceIsCompletedIntoDB(req.body, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Review submitted successfully!',
        data: result,
    });
});
// getAvailability
// const getAvailability = asyncHandler(async (req, res) => {
//   const { artistId, serviceId, date } = req.body;
//   const result = await BookingService.getAvailabilityFromDB(artistId,serviceId,date);
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Availability retrieved successfully!',
//     data: result,
//   });
// });
exports.BookingController = {
    ReviewAfterAServiceIsCompleted,
    confirmPaymentByClient,
    getArtistSchedule,
    completeSession,
    artistMarksCompleted,
    deleteSession,
    cancelBooking,
    getUserBookings,
    repayBooking,
    createBooking,
    createSession,
    confirmBookingByArtist,
    completeBooking,
};

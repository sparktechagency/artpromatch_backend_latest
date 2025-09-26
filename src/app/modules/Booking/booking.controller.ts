import httpStatus from 'http-status';
import { AppError, asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { BookingService } from './booking.service';

// create booking
const createBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.createBookingIntoDB(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booking Created Successfully, pay now!',
    data: result,
  });
});

// confirm payment by client
const confirmPaymentByClient = asyncHandler(async (req, res) => {
  const query = req.query as { sessionId: string };
  const result = await BookingService.confirmPaymentByClient(query);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Payment successfull!',
    data: result,
  });
});

// repay booking
const repayBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.repayBookingIntoDb(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Payment successfull!',
    data: result,
  });
});

// get user bookings
const getUserBookings = asyncHandler(async (req, res) => {
  const result = await BookingService.getUserBookings(req.user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booking retrieve Successfully!',
    data: result,
  });
});

// create session
const createSession = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const result = await BookingService.createOrUpdateSessionIntoDB(
    bookingId,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Session Created Successfully!',
    data: result,
  });
});

// get artist schedule
const getArtistSchedule = asyncHandler(async (req, res) => {
  const result = await BookingService.getArtistDailySchedule(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Schedule retrieved Successfully!',
    data: result,
  });
});

// complete session
const completeSession = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { sessionId } = req.body;

  const result = await BookingService.completeSessionByArtist(
    bookingId,
    sessionId
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Session Created Successfully!',
    data: result,
  });
});

// artist marks as completed
const artistMarksCompleted = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const result = await BookingService.artistMarksCompletedIntoDb(
    req.user,
    bookingId
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'OTP is sent the client phone. Please input the OTP here!',
    data: result,
  });
});

const resendBookingOtp = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const result = await BookingService.resendBookingOtp(bookingId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message:
      'otp is sent your customer phone or email.please take that otp from him to complete the booking!',
    data: result,
  });
});

// complete booking
const completeBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const otp = req.body.otp;

  if (!otp) throw new AppError(httpStatus.BAD_REQUEST, 'OTP is required');

  if (!bookingId)
    throw new AppError(httpStatus.BAD_REQUEST, 'Booking id is required');

  const result = await BookingService.completeBookingIntoDb(
    req.user,
    bookingId,
    otp
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message:
      'Congratulations! Booking Completed Successfully! Money is transferred to your account. Stripe will pay it after 7 days',
    data: result,
  });
});

// delete session
const deleteSession = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const result = await BookingService.deleteSessionFromBooking(
    bookingId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Session Created Successfully!',
    data: result,
  });
});

// confirm booking
const confirmBookingByArtist = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const result = await BookingService.confirmBookingByArtist(bookingId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booking confirmed Successfully!',
    data: result,
  });
});

// cancel booking
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const role = req.user.role;
  if (!['ARTIST', 'CLIENT'].includes(role))
    throw new AppError(httpStatus.NOT_FOUND, 'this is not valid role');
  const result = await BookingService.cancelBookingIntoDb(
    bookingId,
    role as 'ARTIST' | 'CLIENT'
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booking cancel Successfully!',
    data: result,
  });
});

// review
const ReviewAfterAServiceIsCompleted = asyncHandler(async (req, res) => {
  const result = await BookingService.ReviewAfterAServiceIsCompletedIntoDB(
    req.body,
    req.user
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
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

export const BookingController = {
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
  resendBookingOtp,
};

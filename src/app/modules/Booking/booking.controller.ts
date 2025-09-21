import httpStatus from 'http-status';
import { AppError, asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { BookingService } from './booking.service';

// create booking
const createBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.createBookingIntoDB(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booking Created Successfully!',
    data: result,
  });
});

const confirmPaymentByClient = asyncHandler(async (req, res) => {
  const query = req.query as { sessionId: string };
  console.log(query);
  const result = await BookingService.confirmPaymentByClient(query);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'payment Successfully!',
    data: result,
  });
});

// repay booking
const repayBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.repayBookingIntoDb(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'payment Successfully!',
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

// delete session
const deleteSession = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  console.log(req.body);
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
    message: 'booking confirm Successfully by Artist!',
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
    message: 'booking cancel Successfully!',
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
  // createBooking,
  ReviewAfterAServiceIsCompleted,
  // getAvailability,
  confirmPaymentByClient,
  getArtistSchedule,
  completeSession,
  deleteSession,
  cancelBooking,
  getUserBookings,
  repayBooking,
  createBooking,
  createSession,
  confirmBookingByArtist,
};

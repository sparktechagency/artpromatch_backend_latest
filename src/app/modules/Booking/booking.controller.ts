import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { BookingService } from './booking.service';
import sendResponse from '../../utils/sendResponse';

// createBooking
// const createBooking = asyncHandler(async (req, res) => {
//   const result = await BookingService.createBookingIntoDB(
//     req.user,
//     req.body,
//     req.file
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Booked successfully!',
//     data: result,
//   });
// });

// ReviewAfterAServiceIsCompleted
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

const createBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.createBookingIntoDB(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booking Created Successfully!',
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
  createBooking
};

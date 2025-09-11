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

export const BookingController = {
  // createBooking,
  ReviewAfterAServiceIsCompleted,
};

import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { BookingService } from './booking.service';
import sendResponse from '../../utils/sendResponse';

const saveBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.createBooking(
    req.user,
    req.body,
    req.file
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Booked successfully!',
    data: result,
  });
});

export const BookingController = {
  saveBooking,
};

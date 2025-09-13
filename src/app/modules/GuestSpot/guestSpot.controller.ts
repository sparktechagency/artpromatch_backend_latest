import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { GuestSpotService } from './guestSpot.service';

// createGuestSpot
const createGuestSpot = asyncHandler(async (req, res) => {
  const result = await GuestSpotService.createGuestSpotIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'GuestSpot created successfully!',
    data: result,
  });
});

// updateGuestSpot
const updateGuestSpot = asyncHandler(async (req, res) => {
  const { guestSpotId } = req.params;

  const result = await GuestSpotService.updateGuestSpotIntoDB(
    req.user,
    guestSpotId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'GuestSpot updated successfully!',
    data: result,
  });
});

export const GuestSpotController = {
  createGuestSpot,
  updateGuestSpot,
};

import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { GuestSpotService } from './guestSpot.service';

// getAllGuestSpots
const getAllGuestSpots = asyncHandler(async (req, res) => {
  const result = await GuestSpotService.getAllGuestSpotsFromDB(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'GuestSpots fetched successfully!',
    data: result,
  });
});
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
  getAllGuestSpots,
  createGuestSpot,
  updateGuestSpot,
};

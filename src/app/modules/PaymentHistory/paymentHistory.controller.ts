import { asyncHandler } from '../../utils';
import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse';
import { PaymentHistoryService } from './paymentHistory.service';

// getAllPaymentsForClientAndArtist
const getAllPaymentsForClientAndArtist = asyncHandler(async (req, res) => {
  const result =
    await PaymentHistoryService.getAllPaymentsForClientAndArtistFromDB(
      req.query,
      req.user
    );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Payments retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// getAllPaymentsForAdmin
const getAllPaymentsForAdmin = asyncHandler(async (req, res) => {
  const result = await PaymentHistoryService.getAllPaymentsForAdminFromDB(
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'All payments retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

export const PaymentHistoryController = {
  getAllPaymentsForClientAndArtist,
  getAllPaymentsForAdmin,
};

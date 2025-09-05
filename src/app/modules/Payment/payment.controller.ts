import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { PaymentService } from './payment.service';
import sendResponse from '../../utils/sendResponse';

const createSubscription = asyncHandler(async (req, res) => {
  const result = await PaymentService.createSubscriptionIntoDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Payment url sent successfully!',
    data: result,
  });
});

const handlePaymentSuccess = asyncHandler(async (req, res) => {
  const { message } = await PaymentService.verifyPaymentSuccess(
    req.user,
    req.query.session_id as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Payment handled successfully!',
    data: message,
  });
});

export const PaymentController = {
  createSubscription,
  handlePaymentSuccess,
};

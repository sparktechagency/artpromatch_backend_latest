import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { FaqService } from './faq.service';

const createFaq = asyncHandler(async (req, res) => {
  const result = await FaqService.createFaqintoDb(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Frequently Asked Question Created Successfully!',
    data: result,
  });
});

const getAllFaqForAdmin = asyncHandler(async (req, res) => {
  const result = await FaqService.getAllFaqForAdmin(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Frequently Asked Question retrieved Successfully!',
    data: result.data,
    meta: result.meta,
  });
});

const getAllFaqForUser = asyncHandler(async (req, res) => {
  const result = await FaqService.getAllFaqForUser(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Frequently Asked Question retrieved Successfully!',
    data: result,
  });
});

const updateFaq = asyncHandler(async (req, res) => {
  const result = await FaqService.updateFaqIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Frequently Asked Question updated Successfully!',
    data: result,
  });
});

const deleteFaq = asyncHandler(async (req, res) => {
  const result = await FaqService.deleteFaqFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Frequently Asked Question deleted Successfully!',
    data: result,
  });
});

export const faqController = {
  createFaq,
  updateFaq,
  deleteFaq,
  getAllFaqForAdmin,
  getAllFaqForUser,
};

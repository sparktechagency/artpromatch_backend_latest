import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse';
import { asyncHandler } from '../../utils';
import MessageService from './message.services';

const new_message: RequestHandler = asyncHandler(async (req, res) => {
  const result = await MessageService.new_message_IntoDb(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Successfully Send By The Message',
    data: result,
  });
});

const updateMessageById: RequestHandler = asyncHandler(async (req, res) => {
  const result = await MessageService.updateMessageById_IntoDb(
    req.params.messageId,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Successfully Update The Message',
    data: result,
  });
});

const deleteMessageById: RequestHandler = asyncHandler(async (req, res) => {
  const result = await MessageService.deleteMessageById_IntoDb(
    req.params.messageId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Successfully Delete Message',
    data: result,
  });
});

const MessageController = {
  new_message,
  updateMessageById,
  deleteMessageById,
};

export default MessageController;

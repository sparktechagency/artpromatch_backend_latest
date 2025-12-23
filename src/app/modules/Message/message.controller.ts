import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse';
import { asyncHandler } from '../../utils';
import { MessageServices } from './message.service';

const newMessage: RequestHandler = asyncHandler(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result = await MessageServices.newMessageIntoDb(
    req.user,
    req.body,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Successfully Send By The Message',
    data: result,
  });
});

const updateMessageById: RequestHandler = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result = await MessageServices.updateMessageByIdIntoDb(
    messageId,
    req.body,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Message updated successfully',
    data: result,
  });
});

const deleteMessageById: RequestHandler = asyncHandler(async (req, res) => {
  const result = await MessageServices.deleteMessageByIdIntoDb(
    req.params.messageId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Successfully Delete Message',
    data: result,
  });
});

export const MessageController = {
  newMessage,
  updateMessageById,
  deleteMessageById,
};

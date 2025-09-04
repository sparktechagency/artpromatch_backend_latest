import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { MessageService } from './message.service';
import sendResponse from '../../utils/sendResponse';

const getMessagesByRoom = asyncHandler(async (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const result = await MessageService.fetchMessagesByRoomId(roomId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Messages fetched successfully!',
    data: result,
  });
});

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  // Expect senderId, receiverId, message, messageType, etc. in body
  const messagePayload = req.body;
  const result = await MessageService.createMessage(messagePayload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Message sent successfully!',
    data: result,
  });
});

const removeMessage = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const result = await MessageService.deleteMessage(messageId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Message deleted successfully!',
    data: result,
  });
});

const readMessage = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const result = await MessageService.markMessageAsRead(messageId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Message marked as read!',
    data: result,
  });
});

const pinOrUnpinMessage = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const { pin } = req.body; // expecting { pin: true/false }
  const result = await MessageService.pinMessage(messageId, pin);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: pin ? 'Message pinned!' : 'Message unpinned!',
    data: result,
  });
});

const updatePriority = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const { priority } = req.body; // expecting { priority: 'low' | 'normal' | 'high' }

  const result = await MessageService.updateMessagePriority(
    messageId,
    priority
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Message priority updated!',
    data: result,
  });
});

export const MessageController = {
  getMessagesByRoom,
  sendMessage,
  removeMessage,
  readMessage,
  pinOrUnpinMessage,
  updatePriority,
};

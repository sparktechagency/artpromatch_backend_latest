/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageModel } from './message.model';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { AppError } from '../../utils';
import { IMessage } from './message.interface';

const fetchMessagesByRoomId = async (roomId: string): Promise<IMessage[]> => {
  if (!roomId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Room ID is required');
  }

  // Simple fetch, no transaction needed as no writes happen
  const messages = await MessageModel.find({ roomId, isDeleted: false })
    .sort({ createdAt: 1 })
    .populate('senderId', 'fullName email image')
    .populate('receiverId', 'fullName email image')
    .exec();

  return messages;
};

const createMessage = async (payload: Partial<IMessage>): Promise<IMessage> => {
  if (!payload.senderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Sender id is required');
  }

  if (!payload.receiverId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Receiver id is required');
  }

  if (!payload.message) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message id is required');
  }

  if (!payload.roomId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Room id is required');
  }

  return await MessageModel.create(payload);
};

const deleteMessage = async (messageId: string): Promise<IMessage | null> => {
  if (!messageId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message ID is required');
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // Soft delete
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { isDeleted: true },
      { new: true, session: mongoSession }
    );

    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return message;
  } catch (error: any) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to delete message: ${error.message}`
    );
  }
};

const markMessageAsRead = async (
  messageId: string
): Promise<IMessage | null> => {
  if (!messageId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message ID is required');
  }

  try {
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { is_read: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }

    return message;
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to mark message as read: ${error.message}`
    );
  }
};

const pinMessage = async (
  messageId: string,
  pin: boolean
): Promise<IMessage | null> => {
  if (!messageId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message ID is required');
  }

  try {
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { isPinned: pin },
      { new: true }
    );

    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }

    return message;
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to update pin status: ${error.message}`
    );
  }
};

const updateMessagePriority = async (
  messageId: string,
  priority: 'low' | 'normal' | 'high'
): Promise<IMessage | null> => {
  if (!messageId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message ID is required');
  }

  if (!['low', 'normal', 'high'].includes(priority)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid priority level');
  }

  try {
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { priorityLevel: priority },
      { new: true }
    );

    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }

    return message;
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to update priority: ${error.message}`
    );
  }
};

export const MessageService = {
  fetchMessagesByRoomId,
  createMessage,
  deleteMessage,
  markMessageAsRead,
  pinMessage,
  updateMessagePriority,
};

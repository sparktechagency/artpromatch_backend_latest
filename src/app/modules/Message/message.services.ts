import Conversation from '../conversation/conversation.model';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { startSession } from 'mongoose';
import { getSocketIO, onlineUsers } from '../../socket copy/socketConnection';
import { AppError } from '../../utils';
import { Auth } from '../Auth/auth.model';
import Message from './message.model';
import { NewMessagePayload } from './message.interface';


// send message
const new_message_IntoDb = async (
  user: JwtPayload,
  data: NewMessagePayload
) => {
  const isReceiverExist = await Auth.findById(data.receiverId);
  if (!isReceiverExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Receiver ID not found');
  }

  if (user.id === data.receiverId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'SenderId and ReceiverId cannot be the same'
    );
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [user.id, data.receiverId], $size: 2 },
  });

  const io = getSocketIO();
  let isNewConversation = false;

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [user.id, data.receiverId],
    });
    isNewConversation = true;
  }

  const participants = [user.id.toString(), data.receiverId.toString()];
  for (const participantId of participants) {
    const socketId = onlineUsers.get(participantId);
    if (socketId) {
      const participantSocket = io.sockets.sockets.get(socketId);
      if (participantSocket) {
        participantSocket.join(conversation._id.toString());
        participantSocket.data.currentConversationId =
          conversation._id.toString();
      }
    }
  }

  const messageData = {
    text: data.text,
    imageUrl: data.imageUrl || [],
    audioUrl: data.audioUrl || '',
    msgByUser: user.id,
    conversationId: conversation._id,
  };

  const saveMessage = await Message.create(messageData);

  await Conversation.updateOne(
    { _id: conversation._id },
    { lastMessage: saveMessage._id }
  );

  const room = io.sockets.adapter.rooms.get(conversation._id.toString());
  if (room && room.size > 1) {
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);
      if (
        s &&
        s.data?.currentConversationId === conversation._id.toString() &&
        s.id !== onlineUsers.get(user.id.toString())
      ) {
        await Message.updateOne(
          { _id: saveMessage._id },
          { $set: { seen: true } }
        );

        io.to(conversation._id.toString()).emit('messages-seen', {
          conversationId: conversation._id,
          seenBy: user.id,
          messageIds: [saveMessage._id],
        });
      }
    }
  }

  const updatedMsg = await Message.findById(saveMessage._id);
  io.to(conversation._id.toString()).emit('new-message', updatedMsg);

  if (isNewConversation) {
    io.to(data.receiverId.toString()).emit('conversation-created', {
      conversationId: conversation._id,
      lastMessage: updatedMsg,
    });

    io.to(data.receiverId.toString()).emit('new-message', updatedMsg);

    const senderSocketId = onlineUsers.get(user.id.toString());
    if (senderSocketId) {
      const senderSocket = io.sockets.sockets.get(senderSocketId);
      senderSocket?.emit('conversation-created', {
        conversationId: conversation._id,
        lastMessage: updatedMsg,
      });
    }
  }

  return updatedMsg;
};

//update message
const updateMessageById_IntoDb = async (
  messageId: string,
  updateData: Partial<{ text: string; imageUrl: string[] }>
) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { $set: updateData },
      { new: true, session }
    );

    if (!updated) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }

    await Conversation.updateMany(
      { lastMessage: messageId },
      { $set: { lastMessage: updated._id } },
      { session }
    );

    const conversation = await Conversation.findById(
      updated.conversationId
    ).session(session);

    if (!conversation) {
      throw new AppError(httpStatus.NOT_FOUND, 'Conversation not found');
    }

    await session.commitTransaction();
    session.endSession();

    const io = getSocketIO();
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit('message-updated', updated);
    });

    return updated;
  } catch (error: unknown) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error instanceof Error ? error.message : String(error)
    );
  }
};

const deleteMessageById_IntoDb = async (messageId: string) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const message = await Message.findById(messageId).session(session);
    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }

    const conversationId = message.conversationId;

    await Message.deleteOne({ _id: messageId }).session(session);

    const conversation = await Conversation.findById(conversationId).session(
      session
    );
    if (!conversation) {
      throw new AppError(httpStatus.NOT_FOUND, 'Conversation not found');
    }

    if (conversation.lastMessage?.toString() === messageId.toString()) {
      const newLastMessage = await Message.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .session(session);

      conversation.lastMessage = newLastMessage ? newLastMessage._id : null;
      await conversation.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const io = getSocketIO();
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit('message-deleted', {
        messageId,
        conversationId,
      });
    });

    return {
      success: true,
      message: 'Message deleted successfully',
      messageId,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error instanceof Error ? error.message : String(error)
    );
  }
};

const MessageServices = {
  new_message_IntoDb,
  updateMessageById_IntoDb,
  deleteMessageById_IntoDb,
};

export default MessageServices;

import { Server, Socket } from 'socket.io';
import Auth from '../../modules/Auth/auth.model';
import Conversation from '../../modules/Conversation/conversation.model';
import Message from '../../modules/Message/message.model';
import { Types } from 'mongoose';

interface SendMessageData {
  receiverId: string;
  text: string;
}

export const handleSendMessage = async (
  io: Server,
  socket: Socket,
  currentUserId: string,
  data: SendMessageData
) => {
  if (currentUserId === data.receiverId) {
    return socket.emit('socket-error', {
      event: 'new-message',
      message: `You can't chat with yourself`,
    });
  }

  const receiver = await Auth.findById(
    new Types.ObjectId(data.receiverId)
  ).select('_id');

  if (!receiver) {
    return socket.emit('socket-error', {
      event: 'new-message',
      message: 'Receiver ID not found!',
    });
  }

  let isNewConversation = false;

  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, data.receiverId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, data.receiverId],
    });
    isNewConversation = true;
  }

  const conversationIdString = conversation._id.toString();

  socket.join(conversationIdString);
  socket.data.currentConversationId = conversationIdString;

  const messageData = {
    text: data.text,
    msgByUser: currentUserId,
    conversationId: conversation._id,
  };

  const saveMessage = await Message.create(messageData);

  await Conversation.updateOne(
    { _id: conversation._id },
    { lastMessage: saveMessage._id }
  );

  // auto-seen logic
  const room = io.sockets.adapter.rooms.get(conversationIdString);

  if (room && room.size > 1) {
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);

      if (
        s &&
        s.data?.currentConversationId === conversationIdString &&
        s.id !== socket.id
      ) {
        await Message.updateOne(
          { _id: saveMessage._id },
          { $set: { seen: true } }
        );

        io.to(conversationIdString).emit('messages-seen', {
          conversationId: conversationIdString,
          seenBy: currentUserId,
          messageIds: [saveMessage._id.toString()],
        });

        break;
      }
    }
  }

  const updatedMsg = await Message.findById(saveMessage._id);
  io.to(conversationIdString).emit('new-message', updatedMsg);

  if (isNewConversation) {
    io.to(data.receiverId.toString()).emit('conversation-created', {
      conversationId: conversation._id,
      lastMessage: updatedMsg,
    });

    io.to(data.receiverId.toString()).emit('new-message', updatedMsg);

    socket.emit('conversation-created', {
      conversationId: conversation._id,
      message: updatedMsg,
    });
  }
};

import { Socket } from 'socket.io';
import { getSocketIO, onlineUsers } from '../socketConnection';
import Conversation from '../../modules/conversation/conversation.model';
import QueryBuilder from 'mongoose-query-builders';
import Message from '../../modules/Message/message.modal';
import { IAuth } from '../../modules/Auth/auth.interface';

export const handleMessagePage = async (
  socket: Socket,
  currentUserId: string,
  data: {
    conversationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }
) => {
  const { conversationId, page = 1, limit = 15, search = '' } = data;

  const conversation = await Conversation.findById(conversationId).populate<{
    participants: IAuth[];
  }>('participants', '-password -refreshToken');

  console.log('conversation', conversation);

  if (!conversation) {
    return socket.emit('socket-error', {
      event: 'message-page',
      message: 'Conversation not found',
    });
  }

  const otherUser = conversation.participants.find(
    (u) => u._id.toString() !== currentUserId
  );

  if (!otherUser) {
    return socket.emit('socket-error', {
      event: 'message-page',
      message: 'Other user not found in conversation',
    });
  }

  const payload = {
    receiverId: otherUser._id,
    name: otherUser.fullName,
    profileImage: otherUser.image,
    online: onlineUsers.has(otherUser._id.toString()),
  };

  socket.emit('message-user', payload);

  const messageQuery = new QueryBuilder(Message.find({ conversationId }), {
    page,
    limit,
    search,
  })
    .search(['text'])
    .sort()
    .paginate();

  const messages = await messageQuery.modelQuery;
  const meta = await messageQuery.countTotal();

  const unseenMessages = messages.filter(
    (msg) =>
      msg.msgByUserId.toString() === otherUser._id.toString() && !msg.seen
  );

  console.log('unseenmessage', unseenMessages);
  if (unseenMessages.length > 0) {
    const messageIds = unseenMessages.map((msg) => msg._id);

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { seen: true } }
    );

    const io = getSocketIO();

    io.to(conversationId.toString()).emit('messages-seen', {
      conversationId,
      seenBy: currentUserId,
      messageIds,
    });
  }

  socket.emit('messages', {
    conversationId,
    userData: payload,
    messages: messages.reverse(),
    meta,
  });

  socket.join(conversationId.toString());

  socket.data.currentConversationId = conversationId;
};

/* eslint-disable no-console */
import { Server as IOServer, Socket } from 'socket.io';
import { handleMessagePage } from './chat/getMessages';
import { handleSendMessage } from './chat/sendMessage';
import { SOCKET_EVENTS } from './socket.constant';
import { getConversationList } from '../helper/getConversationLIst';

const handleChatEvents = async (
  io: IOServer,
  socket: Socket,
  currentUserId: string
): Promise<void> => {
  // join conversation
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async (conversationId: string) => {
    socket.join(conversationId);
    socket.data.currentConversationId = conversationId;
    console.log(`User ${currentUserId} joined room ${conversationId}`);
  });

  socket.on(SOCKET_EVENTS.GET_CONVERSATIONS, async (query) => {
    try {
      const conversations = await getConversationList(currentUserId, query);

      socket.emit('conversation-list', conversations);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      socket.emit('socket-error', { errorMessage });
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_PAGE, (data) => {
    handleMessagePage(socket, currentUserId, data);
  });

  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user-typing', { conversationId, userId });
  });

  socket.on('stop-typing', ({ conversationId, userId }) => {
    socket
      .to(conversationId)
      .emit('user-stop-typing', { conversationId, userId });
  });

  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) =>
    handleSendMessage(io, socket, currentUserId, data)
  );
};

export default handleChatEvents;

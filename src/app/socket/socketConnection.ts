/* eslint-disable no-console */
import { Server as HTTPServer } from 'http';
import { Server as ChatServer, Socket } from 'socket.io';
import handleChatEvents from './handleChatEvents';
import Auth from '../modules/Auth/auth.model';
import Conversation from '../modules/Conversation/conversation.model';
import { SOCKET_EVENTS } from './socket.constant';

let io: ChatServer;

const onlineUsers = new Map<string, string>();

const connectSocket = (server: HTTPServer) => {
  if (!io) {
    io = new ChatServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Authorization', 'Content-Type'],
      },
      pingInterval: 30000,
      pingTimeout: 5000,
      connectTimeout: 45000,
    });
  }

  io.on(SOCKET_EVENTS.CONNECTION, async (socket: Socket) => {
    console.log('Client connected:', socket.id);

    const userId = socket.handshake.query.id as string;

    if (!userId) {
      socket.emit('error', 'User ID is required');
      socket.disconnect();
      return;
    }

    const currentUser = await Auth.findById(userId);
    if (!currentUser) {
      socket.emit('error', 'User not found');
      socket.disconnect();
      return;
    }

    const currentUserId = currentUser._id.toString();

    socket.join(currentUserId);

    onlineUsers.set(currentUserId, socket.id);

    const userConversations = await Conversation.find({
      participants: currentUserId,
    }).select('_id');

    userConversations.forEach((conv) => socket.join(conv._id.toString()));

    handleChatEvents(io, socket, currentUserId);

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Disconnected:', socket.id);
      onlineUsers.delete(currentUserId);
    });
  });

  return io;
};

const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

export { connectSocket, getSocketIO, onlineUsers };

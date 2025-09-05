/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Server, Socket } from 'socket.io';
import { socketAuth } from '../middlewares';
import { MessageData, SOCKET_EVENTS, SocketUser } from './socket.constant';
import { MessageService } from '../modules/Message/message.service';
import { Auth } from '../modules/Auth/auth.model';

const initSocketIo = (io: Server): void => {
  io.use(socketAuth);

  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    const userData: SocketUser = socket.data?.user;

    console.log(`User connected: ${userData?.email}`);

    //! join room listener
    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomId }: { roomId: string }) => {
      socket.join(roomId);
    });

    //! message listener
    socket.on(
      SOCKET_EVENTS.MESSAGE,
      async ({ message, messageType, receiverId, roomId }: MessageData) => {
        if (!message?.trim()) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            status: 400,
            message: 'Message is required',
          });
          return;
        }

        const payload: any = { message, messageType, receiverId };

        payload.roomId = roomId || generateRoomId(userData?._id, receiverId);
        payload.senderId = userData._id;

        const receiver = await Auth.findById(payload.receiverId);

        if (!receiver) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            statusCode: 404,
            message: 'Receiver user not found',
          });
          return;
        }

        const response = await MessageService.createMessage(payload);

        io.to(String(payload.roomId)).emit(SOCKET_EVENTS.MESSAGE, response);
        io.to(String(payload.receiverId)).emit(
          SOCKET_EVENTS.NOTIFICATION,
          response
        );
      }
    );

    // Cleanup on disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`User disconnected: ${userData?.email}`);
      socket.removeAllListeners(SOCKET_EVENTS.MESSAGE);
      socket.removeAllListeners(SOCKET_EVENTS.JOIN_ROOM);
    });
  });
};

const generateRoomId = (senderId: string, receiverId: string): string => {
  const sortedArr = [senderId, receiverId].sort();
  return sortedArr.join('-');
};

export default initSocketIo;

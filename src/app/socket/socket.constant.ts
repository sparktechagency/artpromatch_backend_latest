import { TRole } from '../modules/auth/auth.constant';

export const SOCKET_EVENTS = {
  JOIN_CONVERSATION: 'join-conversation',
  GET_CONVERSATIONS: 'get-conversations',
  MESSAGE_PAGE: 'message-page',
  SEND_MESSAGE: 'send-message',
  ERROR: 'error',
  NOTIFICATION: 'notification',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
} as const;

export type SocketUser = {
  _id: string;
  email: string;
  role: TRole;
};

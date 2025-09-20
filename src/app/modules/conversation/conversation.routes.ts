import express from 'express';

import ConversationController from './conversation.controller';
import { ROLE } from '../Auth/auth.constant';
import { auth } from '../../middlewares';

const router = express.Router();

router.get(
  '/get-chat-list',
  auth(ROLE.ARTIST,ROLE.CLIENT,ROLE.BUSINESS),
  ConversationController.getChatList,
);

export const conversationRoutes = router;

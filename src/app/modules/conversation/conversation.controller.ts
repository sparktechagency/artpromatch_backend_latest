import { RequestHandler } from 'express';

import ConversationService from './conversation.services';
import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';

const getChatList: RequestHandler = asyncHandler(async (req, res) => {
  const result = await ConversationService.getConversation(
    req?.user?.id,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Conversation retrieved successfully',
    data: result,
  });
});

const ConversationController = {
  getChatList,
};

export default ConversationController;

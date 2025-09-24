"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const conversation_services_1 = __importDefault(require("./conversation.services"));
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const getChatList = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await conversation_services_1.default.getConversation(req?.user?.id, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Conversation retrieved successfully',
        data: result,
    });
});
const ConversationController = {
    getChatList,
};
exports.default = ConversationController;

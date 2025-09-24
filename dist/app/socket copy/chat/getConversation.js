"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetConversations = void 0;
const getConversationLIst_1 = require("../../helper/getConversationLIst");
const handleGetConversations = async (currentUserId, query) => {
    const conversations = await (0, getConversationLIst_1.getConversationList)(currentUserId, query);
    return conversations;
};
exports.handleGetConversations = handleGetConversations;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessagePage = void 0;
const socketConnection_1 = require("../socketConnection");
const conversation_model_1 = __importDefault(require("../../modules/conversation/conversation.model"));
const mongoose_query_builders_1 = __importDefault(require("mongoose-query-builders"));
const message_model_1 = __importDefault(require("../../modules/Message/message.model"));
const handleMessagePage = async (socket, currentUserId, data) => {
    const { conversationId, page = 1, limit = 15, search = '' } = data;
    const conversation = await conversation_model_1.default.findById(conversationId).populate('participants', '-password -refreshToken');
    if (!conversation) {
        return socket.emit('socket-error', {
            event: 'message-page',
            message: 'Conversation not found',
        });
    }
    const otherUser = conversation.participants.find((u) => u._id.toString() !== currentUserId);
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
        online: socketConnection_1.onlineUsers.has(otherUser._id.toString()),
    };
    socket.emit('message-user', payload);
    const messageQuery = new mongoose_query_builders_1.default(message_model_1.default.find({ conversationId }), {
        page,
        limit,
        search,
    })
        .search(['text'])
        .sort()
        .paginate();
    const messages = await messageQuery.modelQuery;
    const meta = await messageQuery.countTotal();
    const unseenMessages = messages.filter((msg) => msg.msgByUser.toString() === otherUser._id.toString() && !msg.seen);
    if (unseenMessages.length > 0) {
        const messageIds = unseenMessages.map((msg) => msg._id);
        await message_model_1.default.updateMany({ _id: { $in: messageIds } }, { $set: { seen: true } });
        const io = (0, socketConnection_1.getSocketIO)();
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
exports.handleMessagePage = handleMessagePage;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSeenMessage = void 0;
const conversation_model_1 = __importDefault(require("../../modules/conversation/conversation.model"));
const message_model_1 = __importDefault(require("../../modules/Message/message.model"));
const handleSeenMessage = async (io, socket, currentUserId, conversationId) => {
    const conversation = await conversation_model_1.default.findById(conversationId);
    if (!conversation) {
        return socket.emit('socket-error', {
            errorMessage: 'Conversation not found',
        });
    }
    const otherUserId = conversation.participants.find((id) => id.toString() !== currentUserId);
    const unseenMessages = await message_model_1.default.find({
        conversationId,
        msgByUser: otherUserId,
        seen: false,
    }).select('_id');
    if (!unseenMessages.length)
        return;
    await message_model_1.default.updateMany({ _id: { $in: unseenMessages.map((m) => m._id) } }, { $set: { seen: true } });
    io.to(conversationId.toString()).emit('messages-seen', {
        conversationId,
        seenBy: currentUserId,
        messageIds: unseenMessages.map((m) => m._id),
    });
};
exports.handleSeenMessage = handleSeenMessage;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSendMessage = void 0;
const auth_model_1 = require("../../modules/Auth/auth.model");
const conversation_model_1 = __importDefault(require("../../modules/conversation/conversation.model"));
const message_model_1 = __importDefault(require("../../modules/Message/message.model"));
const handleSendMessage = async (io, socket, currentUserId, data) => {
    if (currentUserId === data.receiverId) {
        return socket.emit('socket-error', {
            event: 'new-message',
            message: `You can't chat with yourself`,
        });
    }
    const receiver = await auth_model_1.Auth.findById(data.receiverId).select('_id');
    if (!receiver) {
        return socket.emit('socket-error', {
            event: 'new-message',
            message: 'Receiver ID not found',
        });
    }
    let isNewConversation = false;
    let conversation = await conversation_model_1.default.findOne({
        participants: { $all: [currentUserId, data.receiverId], $size: 2 },
    });
    if (!conversation) {
        conversation = await conversation_model_1.default.create({
            participants: [currentUserId, data.receiverId],
        });
        isNewConversation = true;
    }
    socket.join(conversation._id.toString());
    socket.data.currentConversationId = conversation._id;
    const messageData = {
        text: data.text,
        msgByUser: currentUserId,
        conversationId: conversation._id,
    };
    const saveMessage = await message_model_1.default.create(messageData);
    await conversation_model_1.default.updateOne({ _id: conversation._id }, { lastMessage: saveMessage._id });
    // auto-seen logic
    const room = io.sockets.adapter.rooms.get(conversation._id.toString());
    if (room && room.size > 1) {
        for (const socketId of room) {
            const s = io.sockets.sockets.get(socketId);
            if (s &&
                s.data?.currentConversationId === conversation._id.toString() &&
                s.id !== socket.id) {
                await message_model_1.default.updateOne({ _id: saveMessage._id }, { $set: { seen: true } });
                io.to(conversation._id.toString()).emit('messages-seen', {
                    conversationId: conversation._id,
                    seenBy: currentUserId,
                    messageIds: [saveMessage._id],
                });
                break;
            }
        }
    }
    const updatedMsg = await message_model_1.default.findById(saveMessage._id);
    io.to(conversation._id.toString()).emit('new-message', updatedMsg);
    if (isNewConversation) {
        io.to(data.receiverId.toString()).emit('conversation-created', {
            conversationId: conversation._id,
            lastMessage: updatedMsg,
        });
        io.to(data.receiverId.toString()).emit('new-message', updatedMsg);
        socket.emit('conversation-created', {
            conversationId: conversation._id,
            message: updatedMsg,
        });
    }
};
exports.handleSendMessage = handleSendMessage;

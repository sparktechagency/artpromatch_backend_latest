"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const conversation_model_1 = __importDefault(require("../conversation/conversation.model"));
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const socketConnection_1 = require("../../socket/socketConnection");
const utils_1 = require("../../utils");
const auth_model_1 = require("../Auth/auth.model");
const message_model_1 = __importDefault(require("./message.model"));
// send message
const new_message_IntoDb = async (user, data) => {
    const isReceiverExist = await auth_model_1.Auth.findById(data.receiverId);
    if (!isReceiverExist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Receiver ID not found');
    }
    if (user.id === data.receiverId) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'SenderId and ReceiverId cannot be the same');
    }
    let conversation = await conversation_model_1.default.findOne({
        participants: { $all: [user.id, data.receiverId], $size: 2 },
    });
    const io = (0, socketConnection_1.getSocketIO)();
    let isNewConversation = false;
    if (!conversation) {
        conversation = await conversation_model_1.default.create({
            participants: [user.id, data.receiverId],
        });
        isNewConversation = true;
    }
    const participants = [user.id.toString(), data.receiverId.toString()];
    for (const participantId of participants) {
        const socketId = socketConnection_1.onlineUsers.get(participantId);
        if (socketId) {
            const participantSocket = io.sockets.sockets.get(socketId);
            if (participantSocket) {
                participantSocket.join(conversation._id.toString());
                participantSocket.data.currentConversationId =
                    conversation._id.toString();
            }
        }
    }
    const messageData = {
        text: data.text,
        imageUrl: data.imageUrl || [],
        audioUrl: data.audioUrl || '',
        msgByUser: user.id,
        conversationId: conversation._id,
    };
    const saveMessage = await message_model_1.default.create(messageData);
    await conversation_model_1.default.updateOne({ _id: conversation._id }, { lastMessage: saveMessage._id });
    const room = io.sockets.adapter.rooms.get(conversation._id.toString());
    if (room && room.size > 1) {
        for (const socketId of room) {
            const s = io.sockets.sockets.get(socketId);
            if (s &&
                s.data?.currentConversationId === conversation._id.toString() &&
                s.id !== socketConnection_1.onlineUsers.get(user.id.toString())) {
                await message_model_1.default.updateOne({ _id: saveMessage._id }, { $set: { seen: true } });
                io.to(conversation._id.toString()).emit('messages-seen', {
                    conversationId: conversation._id,
                    seenBy: user.id,
                    messageIds: [saveMessage._id],
                });
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
        const senderSocketId = socketConnection_1.onlineUsers.get(user.id.toString());
        if (senderSocketId) {
            const senderSocket = io.sockets.sockets.get(senderSocketId);
            senderSocket?.emit('conversation-created', {
                conversationId: conversation._id,
                lastMessage: updatedMsg,
            });
        }
    }
    return updatedMsg;
};
//update message
const updateMessageById_IntoDb = async (messageId, updateData) => {
    const session = await (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        const updated = await message_model_1.default.findByIdAndUpdate(messageId, { $set: updateData }, { new: true, session });
        if (!updated) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Message not found');
        }
        await conversation_model_1.default.updateMany({ lastMessage: messageId }, { $set: { lastMessage: updated._id } }, { session });
        const conversation = await conversation_model_1.default.findById(updated.conversationId).session(session);
        if (!conversation) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Conversation not found');
        }
        await session.commitTransaction();
        session.endSession();
        const io = (0, socketConnection_1.getSocketIO)();
        conversation.participants.forEach((participantId) => {
            io.to(participantId.toString()).emit('message-updated', updated);
        });
        return updated;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, error instanceof Error ? error.message : String(error));
    }
};
const deleteMessageById_IntoDb = async (messageId) => {
    const session = await (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        const message = await message_model_1.default.findById(messageId).session(session);
        if (!message) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Message not found');
        }
        const conversationId = message.conversationId;
        await message_model_1.default.deleteOne({ _id: messageId }).session(session);
        const conversation = await conversation_model_1.default.findById(conversationId).session(session);
        if (!conversation) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Conversation not found');
        }
        if (conversation.lastMessage?.toString() === messageId.toString()) {
            const newLastMessage = await message_model_1.default.findOne({ conversationId })
                .sort({ createdAt: -1 })
                .session(session);
            conversation.lastMessage = newLastMessage ? newLastMessage._id : null;
            await conversation.save({ session });
        }
        await session.commitTransaction();
        session.endSession();
        const io = (0, socketConnection_1.getSocketIO)();
        conversation.participants.forEach((participantId) => {
            io.to(participantId.toString()).emit('message-deleted', {
                messageId,
                conversationId,
            });
        });
        return {
            success: true,
            message: 'Message deleted successfully',
            messageId,
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, error instanceof Error ? error.message : String(error));
    }
};
const MessageServices = {
    new_message_IntoDb,
    updateMessageById_IntoDb,
    deleteMessageById_IntoDb,
};
exports.default = MessageServices;

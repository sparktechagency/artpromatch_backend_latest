"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getConversation_1 = require("./chat/getConversation");
const getMessages_1 = require("./chat/getMessages");
const sendMessage_1 = require("./chat/sendMessage");
const socket_constant_1 = require("./socket.constant");
const handleChatEvents = async (io, socket, currentUserId) => {
    // join conversation
    socket.on(socket_constant_1.SOCKET_EVENTS.JOIN_CONVERSATION, async (conversationId) => {
        socket.join(conversationId);
        socket.data.currentConversationId = conversationId;
        console.log(`User ${currentUserId} joined room ${conversationId}`);
    });
    socket.on(socket_constant_1.SOCKET_EVENTS.GET_CONVERSATIONS, async (query) => {
        try {
            const conversations = await (0, getConversation_1.handleGetConversations)(currentUserId, query);
            socket.emit('conversation-list', conversations);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            socket.emit('socket-error', { errorMessage });
        }
    });
    socket.on(socket_constant_1.SOCKET_EVENTS.MESSAGE_PAGE, (data) => {
        (0, getMessages_1.handleMessagePage)(socket, currentUserId, data);
    });
    socket.on('typing', ({ conversationId, userId }) => {
        socket.to(conversationId).emit('user-typing', { conversationId, userId });
    });
    socket.on('stop-typing', ({ conversationId, userId }) => {
        socket
            .to(conversationId)
            .emit('user-stop-typing', { conversationId, userId });
    });
    socket.on(socket_constant_1.SOCKET_EVENTS.SEND_MESSAGE, (data) => (0, sendMessage_1.handleSendMessage)(io, socket, currentUserId, data));
};
exports.default = handleChatEvents;

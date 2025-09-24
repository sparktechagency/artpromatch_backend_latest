"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUsers = exports.getSocketIO = exports.connectSocket = void 0;
const socket_io_1 = require("socket.io");
const handleChatEvents_1 = __importDefault(require("./handleChatEvents"));
const auth_model_1 = require("../modules/Auth/auth.model");
const conversation_model_1 = __importDefault(require("../modules/conversation/conversation.model"));
const socket_constant_1 = require("./socket.constant");
let io;
const onlineUsers = new Map();
exports.onlineUsers = onlineUsers;
const connectSocket = (server) => {
    if (!io) {
        io = new socket_io_1.Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                allowedHeaders: ['Authorization', 'Content-Type'],
            },
            pingInterval: 30000,
            pingTimeout: 5000,
            connectTimeout: 45000,
        });
    }
    io.on(socket_constant_1.SOCKET_EVENTS.CONNECTION, async (socket) => {
        console.log('Client connected:', socket.id);
        const userId = socket.handshake.query.id;
        if (!userId) {
            socket.emit('error', 'User ID is required');
            socket.disconnect();
            return;
        }
        const currentUser = await auth_model_1.Auth.findById(userId);
        if (!currentUser) {
            socket.emit('error', 'User not found');
            socket.disconnect();
            return;
        }
        const currentUserId = currentUser._id.toString();
        socket.join(currentUserId);
        onlineUsers.set(currentUserId, socket.id);
        const userConversations = await conversation_model_1.default.find({
            participants: currentUserId,
        }).select('_id');
        userConversations.forEach((conv) => socket.join(conv._id.toString()));
        (0, handleChatEvents_1.default)(io, socket, currentUserId);
        socket.on(socket_constant_1.SOCKET_EVENTS.DISCONNECT, () => {
            console.log('Disconnected:', socket.id);
            onlineUsers.delete(currentUserId);
        });
    });
    return io;
};
exports.connectSocket = connectSocket;
const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized!');
    }
    return io;
};
exports.getSocketIO = getSocketIO;

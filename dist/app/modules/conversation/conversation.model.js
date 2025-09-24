"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
    participants: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'User',
    },
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const Conversation = (0, mongoose_1.model)('Conversation', conversationSchema);
exports.default = Conversation;

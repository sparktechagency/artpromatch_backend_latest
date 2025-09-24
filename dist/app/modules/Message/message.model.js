"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    text: {
        type: String,
        default: '',
    },
    imageUrl: {
        type: [String],
        default: [],
    },
    audioUrl: {
        type: String,
        required: false,
        default: '',
    },
    seen: {
        type: Boolean,
        default: false,
    },
    msgByUser: {
        type: mongoose_1.Schema.ObjectId,
        required: true,
        ref: 'User',
    },
    conversationId: {
        type: mongoose_1.Schema.ObjectId,
        required: true,
        ref: 'Conversation',
    },
}, {
    timestamps: true,
    versionKey: false,
});
const Message = (0, mongoose_1.model)('Message', messageSchema);
exports.default = Message;

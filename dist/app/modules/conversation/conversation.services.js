"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = require("mongoose");
const conversation_model_1 = __importDefault(require("./conversation.model"));
const auth_model_1 = require("../Auth/auth.model");
const QueryBuilder_1 = __importDefault(require("../../builders/QueryBuilder"));
const message_model_1 = __importDefault(require("../Message/message.model"));
const getConversation = async (profileId, query) => {
    const profileObjectId = new mongoose_1.Types.ObjectId(profileId);
    const searchTerm = query.searchTerm;
    let userSearchFilter = {};
    // 🔍 Search by user name (optional)
    if (searchTerm) {
        const matchingUsers = await auth_model_1.Auth.find({ name: { $regex: searchTerm, $options: 'i' } }, '_id');
        const matchingUserIds = matchingUsers.map((user) => user._id);
        userSearchFilter = {
            participants: { $in: matchingUserIds },
        };
    }
    // 🧠 Fetch conversations with the user
    const currentUserConversationQuery = new QueryBuilder_1.default(conversation_model_1.default.find({
        participants: profileObjectId,
        ...userSearchFilter,
    })
        .sort({ updatedAt: -1 })
        .populate({ path: 'participants', select: 'name photo _id email' })
        .populate('lastMessage'), query)
        .fields()
        .filter()
        .paginate()
        .sort();
    const currentUserConversation = await currentUserConversationQuery.modelQuery;
    // 📨 Format conversation list
    const conversationList = await Promise.all(currentUserConversation.map(async (conv) => {
        const otherUser = conv.participants.find((user) => user._id.toString() !== profileId);
        const unseenCount = await message_model_1.default.countDocuments({
            conversationId: conv._id,
            msgByUser: { $ne: profileObjectId },
            seen: false,
        });
        return {
            _id: conv._id,
            userData: {
                _id: otherUser?._id,
                name: otherUser?.name,
                profileImage: otherUser?.photo,
                email: otherUser?.email,
            },
            unseenMsg: unseenCount,
            lastMsg: conv.lastMessage,
        };
    }));
    const meta = await currentUserConversationQuery.countTotal();
    return {
        meta,
        result: conversationList,
    };
};
const ConversationService = {
    getConversation,
};
exports.default = ConversationService;

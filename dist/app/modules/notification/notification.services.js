"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notification_model_1 = __importDefault(require("./notification.model"));
const mongoose_query_builders_1 = __importDefault(require("mongoose-query-builders"));
const getAllNotifications = async (query, userId) => {
    const baseQuery = notification_model_1.default.find({ receiver: userId });
    const builder = new mongoose_query_builders_1.default(baseQuery, query);
    builder.search(['title', 'message']).filter().sort().paginate().fields();
    const data = await builder.modelQuery.exec();
    const meta = await builder.countTotal();
    return {
        meta: {
            page: meta.page,
            limit: meta.limit,
            total: meta.total,
            totalPages: meta.totalPage,
        },
        data,
    };
};
const markNotificationAsSeen = async (notificationId) => {
    const updated = await notification_model_1.default.findByIdAndUpdate(notificationId, { isSeen: true }, { new: true });
    return updated;
};
const getAllUnseenNotificationCount = async (userId) => {
    const result = await notification_model_1.default.aggregate([
        {
            $match: {
                receiver: new mongoose_1.Types.ObjectId(userId),
                isSeen: false,
            },
        },
        {
            $count: 'unseenCount',
        },
    ]);
    return result[0]?.unseenCount || 0;
};
exports.default = {
    getAllNotifications,
    markNotificationAsSeen,
    getAllUnseenNotificationCount
};

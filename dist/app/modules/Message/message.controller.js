"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const utils_1 = require("../../utils");
const message_services_1 = __importDefault(require("./message.services"));
const new_message = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await message_services_1.default.new_message_IntoDb(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Successfully Send By The Message',
        data: result,
    });
});
const updateMessageById = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await message_services_1.default.updateMessageById_IntoDb(req.params.messageId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Successfully Update The Message',
        data: result,
    });
});
const deleteMessageById = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await message_services_1.default.deleteMessageById_IntoDb(req.params.messageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Successfully Delete Message',
        data: result,
    });
});
const MessageController = {
    new_message,
    updateMessageById,
    deleteMessageById,
};
exports.default = MessageController;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const conversation_controller_1 = __importDefault(require("./conversation.controller"));
const auth_constant_1 = require("../Auth/auth.constant");
const middlewares_1 = require("../../middlewares");
const router = express_1.default.Router();
router.get('/get-chat-list', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.BUSINESS), conversation_controller_1.default.getChatList);
exports.conversationRoutes = router;

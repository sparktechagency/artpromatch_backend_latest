"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const lib_1 = require("../../lib");
const utils_1 = require("../../utils");
const validateRequest_1 = require("../../middlewares/validateRequest");
const message_validation_1 = __importDefault(require("./message.validation"));
const message_controller_1 = __importDefault(require("./message.controller"));
const router = express_1.default.Router();
router.post('/new_message', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.BUSINESS), lib_1.upload.fields([
    { name: 'imageUrl', maxCount: 10 },
    { name: 'audioUrl', maxCount: 1 },
]), (req, _res, next) => {
    try {
        if (req.body.data && typeof req.body.data === 'string') {
            req.body = JSON.parse(req.body.data);
        }
        const files = req.files;
        // Handle image uploads if they exist
        if (files?.imageUrl) {
            // Store paths of uploaded images
            req.body.imageUrl = files.imageUrl.map((file) => file.path.replace(/\\/g, '/'));
        }
        if (files?.audioUrl && files.audioUrl.length > 0) {
            const audioPaths = files.audioUrl.map((file) => file.path.replace(/\\/g, '/'));
            req.body.audioUrl =
                audioPaths.length === 1 ? audioPaths[0] : audioPaths;
        }
        next();
    }
    catch (error) {
        next(new utils_1.AppError(http_status_1.default.BAD_REQUEST, error instanceof Error ? error.message : String(error)));
    }
}, (0, validateRequest_1.validateRequestFromFormData)(message_validation_1.default.messageSchema), message_controller_1.default.new_message);
router.patch('/update_message_by_Id/:messageId', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT), lib_1.upload.fields([{ name: 'imageUrl', maxCount: 5 }]), (req, _res, next) => {
    try {
        if (req.body.data && typeof req.body.data === 'string') {
            req.body = JSON.parse(req.body.data);
        }
        const files = req.files;
        if (files?.imageUrl) {
            req.body.imageUrl = files.imageUrl.map((file) => file.path.replace(/\\/g, '/'));
        }
        next();
    }
    catch (error) {
        next(new utils_1.AppError(http_status_1.default.BAD_REQUEST, error instanceof Error ? error.message : String(error)));
    }
}, (0, middlewares_1.validateRequest)(message_validation_1.default.messageUpdateSchema), message_controller_1.default.updateMessageById);
router.delete('/delete_message/:messageId', (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.CLIENT), message_controller_1.default.deleteMessageById);
const messageRoutes = router;
exports.default = messageRoutes;

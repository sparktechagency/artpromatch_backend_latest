"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.sendContactUsEmail = exports.deleteFile = exports.sendOtpEmail = exports.options = exports.notFound = exports.globalErrorHandler = exports.asyncHandler = exports.AppError = void 0;
const logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
const AppError_1 = __importDefault(require("./AppError"));
exports.AppError = AppError_1.default;
const asyncHandler_1 = __importDefault(require("./asyncHandler"));
exports.asyncHandler = asyncHandler_1.default;
const deleteFile_1 = require("./deleteFile");
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return deleteFile_1.deleteFile; } });
const globalErrorHandler_1 = __importDefault(require("./globalErrorHandler"));
exports.globalErrorHandler = globalErrorHandler_1.default;
const notFound_1 = __importDefault(require("./notFound"));
exports.notFound = notFound_1.default;
const sendContactUsEmail_1 = __importDefault(require("./sendContactUsEmail"));
exports.sendContactUsEmail = sendContactUsEmail_1.default;
const sendOtpEmail_1 = __importDefault(require("./sendOtpEmail"));
exports.sendOtpEmail = sendOtpEmail_1.default;
// JWT configuration
const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000,
};
exports.options = options;

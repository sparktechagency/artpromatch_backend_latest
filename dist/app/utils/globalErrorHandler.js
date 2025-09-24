"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const AppError_1 = __importDefault(require("./AppError"));
const globalErrorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = err.message || 'Something went wrong!';
    let errors = [
        {
            path: '',
            message: 'Something went wrong',
        },
    ];
    if (err instanceof zod_1.ZodError) {
        const modifier = (0, errors_1.handleZodError)(err);
        statusCode = modifier.statusCode;
        message = modifier.message;
        errors = modifier.errors;
    }
    else if (err instanceof mongoose_1.Error.ValidationError) {
        const modifier = (0, errors_1.handleMongooseError)(err);
        statusCode = modifier.statusCode;
        message = modifier.message;
        errors = modifier.errors;
    }
    else if (err instanceof mongoose_1.Error.CastError) {
        const modifier = (0, errors_1.handleCastError)(err);
        statusCode = modifier.statusCode;
        message = modifier.message;
        errors = modifier.errors;
    }
    else if (err?.code === 11000) {
        const modifier = (0, errors_1.handleDuplicateError)(err);
        statusCode = modifier.statusCode;
        message = modifier.message;
        errors = modifier.errors;
    }
    else if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errors = [
            {
                path: '',
                message: err.message,
            },
        ];
    }
    else if (err instanceof mongoose_1.Error) {
        message = err.message;
        errors = [
            {
                path: '',
                message: err.message,
            },
        ];
    }
    return res.status(err?.status || statusCode).json({
        success: false,
        statusCode: err?.status || statusCode,
        message,
        errorMessages: errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
    });
};
exports.default = globalErrorHandler;

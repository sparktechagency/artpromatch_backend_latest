"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleMongooseError = (err) => {
    return {
        statusCode: 400,
        message: 'Validation error',
        errors: Object.values(err.errors).map((error) => ({
            path: error?.path,
            message: error?.message,
        })),
    };
};
exports.default = handleMongooseError;

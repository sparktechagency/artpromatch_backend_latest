"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleCastError = (err) => {
    return {
        statusCode: 400,
        message: 'Invalid mongodb object id',
        errors: [
            {
                path: err?.path,
                message: err?.message,
            },
        ],
    };
};
exports.default = handleCastError;

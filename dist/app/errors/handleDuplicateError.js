"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const handleDuplicateError = (err) => {
    return {
        statusCode: 400,
        message: 'Duplicate field',
        errors: [
            {
                path: Object.keys(err?.keyValue).join(', '),
                message: `${Object.values(err?.keyValue).join(', ')} is already exists`,
            },
        ],
    };
};
exports.default = handleDuplicateError;

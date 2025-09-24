"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleZodError = (err) => {
    return {
        statusCode: 400,
        message: err?.issues[0]?.message,
        errors: err.issues.map((issue) => ({
            path: issue.path[issue.path.length - 1],
            message: issue.message,
        })),
    };
};
exports.default = handleZodError;

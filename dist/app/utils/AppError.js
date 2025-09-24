"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    constructor(statusCode, message = 'Something went wrong!', 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;
        // if (stack) {
        //   this.stack = stack;
        // } else {
        //   Error.captureStackTrace(this, this.constructor);
        // }
        if (process.env.NODE_ENV === "development") {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.default = AppError;

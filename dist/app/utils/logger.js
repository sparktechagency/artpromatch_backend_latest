"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logsDir = path_1.default.join(__dirname, '../../../', 'logs');
// Create logs directory if not exists
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir);
}
const getTimestamp = () => {
    return new Date().toLocaleString(); // e.g. "4/18/2025, 2:35:10 PM"
};
// Log success message to success.txt
const logSuccess = (message) => {
    const logLine = `[SUCCESS] ${getTimestamp()} - ${message}\n`;
    fs_1.default.appendFileSync(path_1.default.join(logsDir, 'success.txt'), logLine, 'utf8');
};
// ❌ Log error message to error.txt (with optional stack)
const logError = (message, error) => {
    let details = '';
    if (error instanceof Error) {
        details = `\nMessage: ${error.message}\nStack: ${error.stack}`;
    }
    else if (typeof error === 'string') {
        details = `\n${error}`;
    }
    else if (typeof error === 'object' && error !== null) {
        details = `\n${JSON.stringify(error, null, 2)}`;
    }
    const logLine = `[ERROR] ${getTimestamp()} - ${message}${details}\n\n`;
    fs_1.default.appendFileSync(path_1.default.join(logsDir, 'error.txt'), logLine, 'utf8');
};
// ℹ️ Optional info log to success.txt
const logInfo = (message) => {
    const logLine = `[INFO] ${getTimestamp()} - ${message}\n`;
    fs_1.default.appendFileSync(path_1.default.join(logsDir, 'success.txt'), logLine, 'utf8');
};
exports.Logger = {
    success: logSuccess,
    error: logError,
    info: logInfo,
};

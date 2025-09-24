"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./index"));
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
dotenv_1.default.config();
if (!index_1.default.firebase_account_key.clientEmail ||
    !index_1.default.firebase_account_key.privateKey ||
    !index_1.default.firebase_account_key.projectId) {
    throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Missing Firebase configuration in environment variables');
}
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert({
        projectId: index_1.default.firebase_account_key.projectId,
        privateKey: index_1.default.firebase_account_key.privateKey.replace(/\\n/g, '\n'),
        clientEmail: index_1.default.firebase_account_key.clientEmail,
    }),
});
const firebaseAdmin = firebase_admin_1.default;
exports.default = firebaseAdmin;

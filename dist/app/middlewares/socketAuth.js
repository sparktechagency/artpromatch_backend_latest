"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuth = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const auth_model_1 = require("../modules/Auth/auth.model");
const lib_1 = require("../lib");
const config_1 = __importDefault(require("../config"));
// import { NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        if (!token) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized');
        }
        // Remove Bearer from token if present
        const cleanToken = token.replace('Bearer ', '');
        const verifiedUser = (0, lib_1.verifyToken)(cleanToken, config_1.default.jwt.access_secret);
        const user = await auth_model_1.Auth.findById(verifiedUser.id).select('-password');
        if (!user || user === null) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
        }
        if (user?._id) {
            socket.join(user?._id.toString());
        }
        // Attach user to socket
        socket.data.user = user;
        next();
    }
    catch {
        next(new Error('Authentication error'));
    }
};
exports.socketAuth = socketAuth;

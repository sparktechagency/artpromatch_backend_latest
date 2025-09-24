"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../utils");
const auth_constant_1 = require("../modules/Auth/auth.constant");
const auth_model_1 = require("../modules/Auth/auth.model");
const lib_1 = require("../lib");
const config_1 = __importDefault(require("../config"));
const auth = (...requiredRoles) => {
    return (0, utils_1.asyncHandler)(async (req, res, next) => {
        const token = req.headers.authorization?.replace('Bearer ', '') || '';
        // checking if the token is missing
        if (!token) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        // checking if the given token is valid
        const decoded = (0, lib_1.verifyToken)(token, config_1.default.jwt.access_secret);
        const { id, iat } = decoded;
        // checking if the user is exist
        const user = await auth_model_1.Auth.findById(id);
        if (!user) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'User not exists!');
        }
        if (user.isDeleted) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        if (!user.isVerifiedByOTP) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        if (user.isDeactivated) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You account is not active now!');
        }
        // checking if any hacker using a token even-after the user changed the password
        if (user.passwordChangedAt && user.isJWTIssuedBeforePasswordChanged(iat)) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        if ((user.role === auth_constant_1.ROLE.ARTIST || user.role === auth_constant_1.ROLE.BUSINESS) &&
            !user.isActive) {
            throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Your profile is not activated by admin yet!');
        }
        else if (user.role === auth_constant_1.ROLE.CLIENT && !user.isActive) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        if (requiredRoles.length && !requiredRoles.includes(user.role)) {
            throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You have no access to this route, Forbidden!');
        }
        req.user = user;
        next();
    });
};
exports.default = auth;

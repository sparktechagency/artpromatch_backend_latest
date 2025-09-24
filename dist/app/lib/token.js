"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createRefreshToken = exports.createAccessToken = void 0;
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const utils_1 = require("../utils");
const createAccessToken = (payload) => {
    const token = jsonwebtoken_1.default.sign(payload, config_1.default.jwt.access_secret, {
        algorithm: 'HS256',
        expiresIn: config_1.default.jwt.access_expires_in,
    });
    return token;
};
exports.createAccessToken = createAccessToken;
// type TArtistTokenData = {
//   id: string;
//   fullName: string;
//   phoneNumber: string;
//   image: string;
//   email: string;
//   role: string;
// };
// export const createArtistAccessToken = (payload: TArtistTokenData): string => {
//   const token = jwt.sign(payload, config.jwt.access_secret!, {
//     algorithm: 'HS256',
//     expiresIn: config.jwt.access_expires_in!,
//   } as SignOptions);
//   return token;
// };
const createRefreshToken = (payload) => {
    const token = jsonwebtoken_1.default.sign(payload, config_1.default.jwt.refresh_secret, {
        algorithm: 'HS256',
        expiresIn: config_1.default.jwt.refresh_expires_in,
    });
    return token;
};
exports.createRefreshToken = createRefreshToken;
const verifyToken = (token, secret) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch {
        throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'Unauthorized access!');
    }
};
exports.verifyToken = verifyToken;

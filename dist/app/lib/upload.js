"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// import { v4 as uuidv4 } from 'uuid';
const utils_1 = require("../utils");
const http_status_1 = __importDefault(require("http-status"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, callback) => {
        let folderPath = './public';
        if (file.mimetype.startsWith('image')) {
            folderPath = './public/images';
        }
        else if (file.mimetype.startsWith('video')) {
            folderPath = './public/videos';
        }
        else {
            callback(new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Only images and videos are allowed'), './public');
            return;
        }
        // Check if the folder exists, if not, create it
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath, { recursive: true });
        }
        callback(null, folderPath);
    },
    filename(_req, file, callback) {
        const fileExt = path_1.default.extname(file.originalname);
        const fileName = `${file.originalname
            .replace(fileExt, '')
            .toLocaleLowerCase()
            .split(' ')
            .join('-')}-${Date.now()}`;
        // .join('-')}-${uuidv4()}`;
        callback(null, fileName + fileExt);
    },
});
const upload = (0, multer_1.default)({ storage });
exports.default = upload;

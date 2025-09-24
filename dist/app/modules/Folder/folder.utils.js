"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTitleCase = exports.deleteSingleImage = exports.deleteSomeImages = exports.deleteSomeMulterFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const deleteSomeMulterFiles = (files) => {
    files?.forEach((file) => (0, exports.deleteSingleImage)(file.path));
};
exports.deleteSomeMulterFiles = deleteSomeMulterFiles;
const deleteSomeImages = (images) => {
    images?.forEach((image) => (0, exports.deleteSingleImage)(image));
};
exports.deleteSomeImages = deleteSomeImages;
const deleteSingleImage = (file) => {
    fs_1.default.unlink(file, () => { });
};
exports.deleteSingleImage = deleteSingleImage;
const toTitleCase = (str) => {
    return str
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
exports.toTitleCase = toTitleCase;

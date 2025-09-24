"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const folder_constant_1 = require("./folder.constant");
const folderSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    for: {
        type: String,
        enum: Object.values(folder_constant_1.FOLDER_FOR),
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
}, { timestamps: true, versionKey: false });
const Folder = (0, mongoose_1.model)('Folder', folderSchema);
exports.default = Folder;

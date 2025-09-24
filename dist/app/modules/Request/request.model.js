"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const request_constant_1 = require("./request.constant");
// Define the request schema
const requestSchema = new mongoose_1.Schema({
    artistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
    },
    businessId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(request_constant_1.REQUEST_STATUS),
        default: request_constant_1.REQUEST_STATUS.PENDING,
    },
}, { timestamps: true, versionKey: false });
const RequestModel = (0, mongoose_1.model)('Request', requestSchema);
exports.default = RequestModel;

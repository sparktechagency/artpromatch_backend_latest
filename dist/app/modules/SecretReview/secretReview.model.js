"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const secretReviewSchema = new mongoose_1.Schema({
    // client: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Client',
    //   required: true,
    //   unique: true,
    // },
    // artist: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Artist',
    //   required: true,
    //   unique: true,
    // },
    service: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Secret Review is required!'],
    },
}, { timestamps: true, versionKey: false });
const SecretReview = (0, mongoose_1.model)('SecretReview', secretReviewSchema);
exports.default = SecretReview;

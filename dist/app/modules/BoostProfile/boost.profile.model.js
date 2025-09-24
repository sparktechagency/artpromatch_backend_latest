"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistBoost = void 0;
const mongoose_1 = require("mongoose");
const ArtistBoostSchema = new mongoose_1.Schema({
    artist: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
        index: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
        default: Date.now() + 12 * 60 * 60 * 1000,
    },
    paymentIntentId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        default: 'pending',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true, versionKey: false });
exports.ArtistBoost = (0, mongoose_1.model)('ArtistBoost', ArtistBoostSchema);

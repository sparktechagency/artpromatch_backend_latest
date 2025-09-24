"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schedule_model_1 = require("../Schedule/schedule.model");
const GuestSpotSchema = new mongoose_1.Schema({
    artist: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String, // 9: 00 am - 10: 00 pm
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    startTimeinMinute: {
        type: Number, // 540 - 1320
        required: true,
    },
    endTimeinMinute: {
        type: Number,
        required: true,
    },
    offDays: schedule_model_1.offDaysSchema,
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true, versionKey: false });
const GuestSpot = (0, mongoose_1.model)('GuestSpot', GuestSpotSchema);
exports.default = GuestSpot;

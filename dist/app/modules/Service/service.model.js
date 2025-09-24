"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const service_interface_1 = require("./service.interface");
const serviceSchema = new mongoose_1.Schema({
    artist: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        validate: {
            validator: function (val) {
                return val.length >= 2 && val.length <= 5;
            },
            message: 'Images array must contain between 2 and 5 items!',
        },
        required: [true, 'Images array must contain between 2 and 5 items!'],
    },
    sessionType: {
        type: String,
        enum: ['short', 'long'],
        required: true,
    },
    price: { type: Number },
    bodyLocation: {
        type: String,
        enum: Object.values(service_interface_1.TattooBodyParts),
        required: true,
    },
    totalCompletedOrder: {
        type: Number,
        default: 0,
    },
    totalReviewCount: {
        type: Number,
        default: 0,
    },
    avgRating: {
        type: Number,
        default: 0,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, versionKey: false });
serviceSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
serviceSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
serviceSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});
const Service = (0, mongoose_1.model)('Service', serviceSchema);
exports.default = Service;

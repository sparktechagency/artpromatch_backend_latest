"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const client_constant_1 = require("./client.constant");
// import { locationSchema } from '../Location/location.model';
const clientSchema = new mongoose_1.Schema({
    auth: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true,
        unique: true,
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            // enum: ['Point'],
            // required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    stringLocation: {
        type: String,
        required: true,
    },
    radius: {
        type: Number,
    },
    lookingFor: {
        type: [String],
        enum: Object.values(client_constant_1.serviceTypes),
        default: [],
    },
    country: {
        type: String,
    },
    favoriteTattoos: {
        type: [String],
        enum: Object.values(client_constant_1.favoriteTattoos),
        default: [],
    },
    favoritePiercing: {
        type: [String],
        enum: Object.values(client_constant_1.favoritePiercings),
        default: [],
    },
    homeView: {
        type: String,
        enum: Object.values(client_constant_1.homeViews),
        default: client_constant_1.homeViews.BOTH,
    },
    preferredArtistType: {
        type: String,
        enum: Object.values(client_constant_1.artistTypes),
        default: client_constant_1.artistTypes.BOTH,
    },
    language: {
        type: String,
    },
    dateFormat: {
        type: String,
        enum: Object.values(client_constant_1.dateFormats),
    },
}, { timestamps: true, versionKey: false });
clientSchema.index({ location: '2dsphere' });
const Client = (0, mongoose_1.model)('Client', clientSchema);
exports.default = Client;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const artist_constant_1 = require("./artist.constant");
// // Subschema: Contact
// const contactSchema = new Schema<TContact>(
//   {
//     email: { type: String },
//     phone: { type: String },
//     address: { type: String },
//   },
//   { _id: false }
// );
// // Subschema: Services
// const servicesSchema = new Schema<TService>(
//   {
//     name: { type: String, required: true },
//     duration: { type: String, required: true },
//     bufferTime: { type: String, default: '' },
//   },
//   { _id: false }
// );
const boostSchema = new mongoose_1.Schema({
    lastBoostAt: { type: Date, default: null },
    endTime: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
}, { _id: false });
// Main Artist Schema
const artistSchema = new mongoose_1.Schema({
    auth: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true,
    },
    business: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Business',
        default: null,
    },
    isConnBusiness: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: Object.values(artist_constant_1.ARTIST_TYPE),
        required: true,
    },
    expertise: {
        type: [String],
        enum: Object.values(artist_constant_1.expertiseTypes),
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    stripeAccountId: {
        type: String,
        default: null,
    },
    isStripeReady: {
        type: Boolean,
        default: false,
    },
    mainLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: { type: [Number], required: true },
    },
    stringLocation: {
        type: String,
        required: true,
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: { type: [Number], required: true },
        currentLocationUntil: { type: Date, default: null },
    },
    hourlyRate: {
        type: Number,
        required: true,
    },
    idCardFront: {
        type: String,
        required: true,
    },
    idCardBack: {
        type: String,
        required: true,
    },
    selfieWithId: {
        type: String,
        required: true,
    },
    boost: {
        type: boostSchema,
        default: () => ({ lastBoostAt: null, endTime: null, isActive: false }),
    },
    // services: {
    //   type: [serviceSchema],
    //   required: true,
    // },
    // contact: {
    //   type: contactSchema,
    // },
    description: {
        type: String,
        required: true,
    },
    preferences: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ArtistPreferences',
    },
    totalCompletedService: {
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
}, { timestamps: true, versionKey: false });
artistSchema.index({ currentLocation: '2dsphere' });
const Artist = (0, mongoose_1.model)('Artist', artistSchema);
exports.default = Artist;

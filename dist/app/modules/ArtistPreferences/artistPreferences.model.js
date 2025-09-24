"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const clientPreferences_model_1 = require("../ClientPreferences/clientPreferences.model");
// import { cancellationPolicy } from '../Artist/artist.constant';
// import { dateFormats, notificationChannel } from '../Client/client.constant';
const client_constant_1 = require("../Client/client.constant");
const artistPreferencesSchema = new mongoose_1.Schema({
    artistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
        unique: true,
    },
    // Profile Settings
    // showAvailability: { type: Boolean, default: true },
    // publiclyVisibleProfile: { type: Boolean, default: true },
    // onlineStatusVisible: { type: Boolean, default: false },
    // Booking Settings
    // cancellationPolicy: {
    //   type: String,
    //   enum: Object.values(cancellationPolicy),
    //   default: cancellationPolicy.ONE_DAY,
    // },
    // allowDirectMessages: { type: Boolean, default: true },
    // Notification Settings (all default: true now)
    // bookingRequests: { type: Boolean, default: true },
    // bookingConfirmations: { type: Boolean, default: true },
    // bookingCancellations: { type: Boolean, default: true },
    // eventReminders: { type: Boolean, default: true },
    // newMessages: { type: Boolean, default: true },
    appUpdates: { type: Boolean, default: true },
    // newAvailability: { type: Boolean, default: true },
    // lastMinuteBookings: { type: Boolean, default: true },
    // newGuestArtists: { type: Boolean, default: true },
    // Notification Channels
    notificationChannels: {
        type: [String],
        enum: Object.values(client_constant_1.notificationChannel),
        default: [client_constant_1.notificationChannel.APP],
    },
    // Security
    // twoFactorAuthEnabled: { type: Boolean, default: false },
    // Locale
    // language: { type: String, default: 'en-UK' },
    // dateFormat: { type: String, default: dateFormats.DDMMYYYY },
    // Connected Accounts
    connectedAccounts: [clientPreferences_model_1.connectedAccountSchema],
}, { timestamps: true, versionKey: false });
const ArtistPreferences = (0, mongoose_1.model)('ArtistPreferences', artistPreferencesSchema);
exports.default = ArtistPreferences;

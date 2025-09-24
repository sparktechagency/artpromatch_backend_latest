"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectedAccountSchema = void 0;
const mongoose_1 = require("mongoose");
exports.connectedAccountSchema = new mongoose_1.Schema({
    provider: {
        type: String,
        enum: ['google', 'apple', 'facebook'],
        required: true,
    },
    connectedOn: {
        type: Date,
        required: true,
    },
});
const clientPreferencesSchema = new mongoose_1.Schema({
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        unique: true,
    },
    // Notifications
    // bookingConfirmations: { type: Boolean, default: true },
    // bookingReminders: { type: Boolean, default: true },
    // bookingCancellations: { type: Boolean, default: true },
    // newMessageNotifications: { type: Boolean, default: true },
    // appUpdates: { type: Boolean, default: true },
    // newAvailability: { type: Boolean, default: true },
    // lastMinuteBookings: { type: Boolean, default: true },
    // newGuestArtists: { type: Boolean, default: true },
    notificationChannels: {
        type: [String],
        enum: ['app', 'email', 'sms'],
        default: ['app'],
    },
    // Connected accounts
    connectedAccounts: {
        type: [exports.connectedAccountSchema],
        default: [],
    },
    // Security & Personalization
    // twoFactorAuthEnabled: { type: Boolean, default: false },
    // personalizedContent: { type: Boolean, default: true },
    // locationSuggestions: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
const ClientPreferences = (0, mongoose_1.model)('ClientPreferences', clientPreferencesSchema);
exports.default = ClientPreferences;

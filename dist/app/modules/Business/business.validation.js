"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessValidation = void 0;
const zod_1 = require("zod");
// Business Profile Validation
const businessProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        studioName: zod_1.z.string().min(3, 'Studio Name is required'),
        businessType: zod_1.z.enum(['Studio', 'Event Organizer', 'Both']),
        country: zod_1.z.string().min(2, 'Country is required'),
    }),
});
// Business Preferences Validation
const businessPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        autoApproveGuestSpots: zod_1.z.boolean(),
        cancellationPolicy: zod_1.z.enum(['24-hour', '48-hour', '72-hour']),
        preferredArtistType: zod_1.z.enum(['Tattoo Artist', 'Piercers', 'Both']),
        preferredExperience: zod_1.z.enum(['1-3 years', '3-5 years', '5+ years']),
        notificationPreferences: zod_1.z.array(zod_1.z.enum(['app', 'email', 'sms'])),
        twoFactorAuthEnabled: zod_1.z.boolean(),
    }),
});
// Business Notification Preferences Validation
const businessNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        guestSpotRequests: zod_1.z.boolean(),
        guestSpotConfirmations: zod_1.z.boolean(),
        guestSpotCancellations: zod_1.z.boolean(),
        newEventRegistrations: zod_1.z.boolean(),
        newMessageAlerts: zod_1.z.boolean(),
        paymentReceivedAlerts: zod_1.z.boolean(),
        newAvailability: zod_1.z.boolean(),
        lastMinuteBookings: zod_1.z.boolean(),
        newGuestArtists: zod_1.z.boolean(),
        notificationPreferences: zod_1.z.array(zod_1.z.enum(['app', 'email', 'sms'])),
    }),
});
// Business Security Settings Validation
const businessSecuritySettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        twoFactorAuthEnabled: zod_1.z.boolean(),
        hideEarnings: zod_1.z.boolean(),
        manualDepositApproval: zod_1.z.boolean(),
        language: zod_1.z.string(),
        dateFormat: zod_1.z.string(),
    }),
});
// guestSpotsSchema
const guestSpotsSchema = zod_1.z.object({
    body: zod_1.z.object({
        guestSpots: zod_1.z
            .array(zod_1.z.object({
            date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
            location: zod_1.z.string(),
        }))
            .nonempty('At least one guest spot is required'),
    }),
});
// Zod validation for setting time off for a business
const timeOffSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    }),
});
exports.BusinessValidation = {
    businessProfileSchema,
    businessPreferencesSchema,
    businessNotificationSchema,
    businessSecuritySettingsSchema,
    guestSpotsSchema,
    timeOffSchema,
};

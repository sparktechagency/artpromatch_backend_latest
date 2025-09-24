"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientValidation = void 0;
const zod_1 = require("zod");
const client_constant_1 = require("./client.constant");
const preferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Favorite Tattoo Styles (Array of favorite tattoo styles)
        favoriteTattooStyles: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.favoriteTattoos)))
            .min(1, 'Please select at least one favorite tattoo style.')
            .optional(),
        // Favorite Piercings (Array of favorite piercing styles)
        favoritePiercings: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.favoritePiercings)))
            .min(1, 'Please select at least one favorite piercing.')
            .optional(),
        // Default Home View (Grid View, Map View, or Both)
        defaultHomeView: zod_1.z
            .enum(Object.values(client_constant_1.homeViews))
            .default(client_constant_1.homeViews.BOTH)
            .optional(),
        // Preferred Artist Type (Tattoo Artist, Piercers, or Both)
        preferredArtistType: zod_1.z
            .enum(Object.values(client_constant_1.artistTypes))
            .default(client_constant_1.artistTypes.BOTH)
            .optional(),
        // Language (string, can be an array of languages based on application preferences)
        language: zod_1.z.string().min(1, 'Language is required').optional(),
        // Date Format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
        dateFormat: zod_1.z
            .enum(Object.values(client_constant_1.dateFormats))
            .default(client_constant_1.dateFormats.DDMMYYYY)
            .optional(),
        // Notification Channels (app, email, sms)
        notificationChannels: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.notificationChannel)))
            .min(1, 'Please select at least one notification channel.')
            .optional(),
    }),
});
const notificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookingConfirmations: zod_1.z.boolean().optional(),
        bookingReminders: zod_1.z.boolean().optional(),
        bookingCancellations: zod_1.z.boolean().optional(),
        newMessageNotifications: zod_1.z.boolean().optional(),
        appUpdates: zod_1.z.boolean().optional(),
        newAvailability: zod_1.z.boolean().optional(),
        lastMinuteBookings: zod_1.z.boolean().optional(),
        newGuestArtists: zod_1.z.boolean().optional(),
        notificationChannels: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.notificationChannel)))
            .min(1, 'Please select at least one notification channel.')
            .optional(),
    }),
});
const privacySecuritySchema = zod_1.z.object({
    body: zod_1.z
        .object({
        twoFactorAuthEnabled: zod_1.z.boolean().optional(),
        personalizedContent: zod_1.z.boolean().optional(),
        locationSuggestions: zod_1.z.boolean().optional(),
    })
        .strict(),
});
const profileInfoSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        fullName: zod_1.z
            .string()
            .nonempty('Name is required')
            .min(3, 'Name must be at least 3 characters long')
            .max(100, 'Name cannot exceed 100 characters')
            .optional(),
    })
        .strict({ message: 'Only "fullName" is allowed in the request body' }),
});
const clientPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        favoriteTattoos: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.favoriteTattoos)))
            .min(1, 'Please select at least one favorite tattoo style.')
            .optional(),
        favoritePiercing: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.favoritePiercings)))
            .min(1, 'Please select at least one favorite piercing.')
            .optional(),
        omeView: zod_1.z
            .enum(Object.values(client_constant_1.homeViews))
            .default(client_constant_1.homeViews.BOTH)
            .optional(),
        preferredArtistType: zod_1.z
            .enum(Object.values(client_constant_1.artistTypes))
            .default(client_constant_1.artistTypes.BOTH)
            .optional(),
        language: zod_1.z.string().min(1, 'Language is required').optional(),
        dateFormat: zod_1.z
            .enum(Object.values(client_constant_1.dateFormats))
            .default(client_constant_1.dateFormats.DDMMYYYY)
            .optional(),
    }),
});
const securitySettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        twoFactorAuthEnabled: zod_1.z.boolean().optional(),
        personalizedContent: zod_1.z.boolean().optional(),
        locationSuggestions: zod_1.z.boolean().optional(),
    }),
});
const NotificationPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        all: zod_1.z.boolean().optional(),
        bookingConfirmations: zod_1.z.boolean().optional(),
        bookingReminders: zod_1.z.boolean().optional(),
        bookingCancellations: zod_1.z.boolean().optional(),
        newMessageNotifications: zod_1.z.boolean().optional(),
        appUpdates: zod_1.z.boolean().optional(),
        newAvailability: zod_1.z.boolean().optional(),
        lastMinuteBookings: zod_1.z.boolean().optional(),
        newGuestArtists: zod_1.z.boolean().optional(),
        notificationPreferences: zod_1.z
            .array(zod_1.z.enum(['app', 'email', 'sms']))
            .min(1, 'Please select at least one notification channel.')
            .optional(),
    }),
});
const updateClientRadiusSchema = zod_1.z.object({
    body: zod_1.z.object({
        radius: zod_1.z.coerce
            .number({
            required_error: 'Radius is required',
            invalid_type_error: 'Radius must be a number',
        })
            .positive('Radius must be greater than 0'),
    }),
});
exports.ClientValidation = {
    preferencesSchema,
    notificationSchema,
    privacySecuritySchema,
    profileInfoSchema,
    clientPreferencesSchema,
    securitySettingsSchema,
    NotificationPreferencesSchema,
    updateClientRadiusSchema,
};

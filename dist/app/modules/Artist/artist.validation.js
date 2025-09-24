"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistValidation = void 0;
const libphonenumber_js_1 = __importDefault(require("libphonenumber-js"));
const zod_1 = require("zod");
const client_constant_1 = require("../Client/client.constant");
const artist_constant_1 = require("./artist.constant");
// Define the validation schemas under the "body" object for each section
const artistProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(3, 'Full name is required'),
    }),
});
const artistPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        showAvailability: zod_1.z.boolean().optional(),
        publiclyVisibleProfile: zod_1.z.boolean().optional(),
        cancellationPolicy: zod_1.z.enum(['24-hour', '48-hour', '72-hour']),
        allowDirectMessages: zod_1.z.boolean(),
        notificationPreferences: zod_1.z.array(zod_1.z.enum(['app', 'email', 'sms'])),
        twoFactorAuthEnabled: zod_1.z.boolean(),
    }),
});
const artistNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookingRequests: zod_1.z.boolean(),
        bookingConfirmations: zod_1.z.boolean(),
        bookingCancellations: zod_1.z.boolean(),
        eventReminders: zod_1.z.boolean(),
        newMessages: zod_1.z.boolean(),
        appUpdates: zod_1.z.boolean(),
        newAvailability: zod_1.z.boolean(),
        lastMinuteBookings: zod_1.z.boolean(),
        newGuestArtists: zod_1.z.boolean(),
        notificationPreferences: zod_1.z.array(zod_1.z.enum(['app', 'email', 'sms'])),
    }),
});
const artistPrivacySecuritySchema = zod_1.z.object({
    body: zod_1.z.object({
        twoFactorAuthEnabled: zod_1.z.boolean(),
        language: zod_1.z.string(),
        dateFormat: zod_1.z.string(),
    }),
});
const updateSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        // Profile Info
        fullName: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email format').optional(),
        phoneNumber: zod_1.z
            .string()
            .refine((val) => {
            const parsed = (0, libphonenumber_js_1.default)(val);
            return parsed?.isValid();
        }, {
            message: 'Phone number must be a valid international format',
        })
            .optional(),
        country: zod_1.z.string().optional(),
        contact: zod_1.z
            .object({
            email: zod_1.z.string().email('Invalid email format').optional(),
            phone: zod_1.z
                .string()
                .refine((val) => {
                const parsed = (0, libphonenumber_js_1.default)(val);
                return parsed?.isValid();
            }, {
                message: 'Phone number must be a valid international format',
            })
                .optional(),
            address: zod_1.z
                .string()
                .min(5, 'Address should be at least 5 characters long')
                .optional(),
        })
            .optional(),
        description: zod_1.z.string().optional(),
        // Preferences
        showAvailability: zod_1.z.boolean().optional().optional(),
        publiclyVisibleProfile: zod_1.z.boolean().optional().optional(),
        cancellationPolicy: zod_1.z
            .enum(Object.values(artist_constant_1.cancellationPolicy))
            .optional(),
        allowDirectMessages: zod_1.z.boolean().optional(),
        notificationPreferences: zod_1.z
            .array(zod_1.z.enum(Object.values(client_constant_1.notificationChannel)))
            .optional(),
        twoFactorAuthEnabled: zod_1.z.boolean().optional(),
        // Notifications
        bookingRequests: zod_1.z.boolean().optional(),
        bookingConfirmations: zod_1.z.boolean().optional(),
        bookingCancellations: zod_1.z.boolean().optional(),
        eventReminders: zod_1.z.boolean().optional(),
        newMessages: zod_1.z.boolean().optional(),
        appUpdates: zod_1.z.boolean().optional(),
        newAvailability: zod_1.z.boolean().optional(),
        lastMinuteBookings: zod_1.z.boolean().optional(),
        newGuestArtists: zod_1.z.boolean().optional(),
        // Privacy & Security
        language: zod_1.z.string().optional(),
        dateFormat: zod_1.z
            .enum(Object.values(client_constant_1.dateFormats))
            .optional(),
        // Artist-specific fields
        services: zod_1.z
            .object({
            hourlyRate: zod_1.z
                .number()
                .min(0, { message: 'Hourly rate must be a non-negative number.' })
                .optional(),
            dayRate: zod_1.z
                .number()
                .min(0, { message: 'Day rate must be a non-negative number.' })
                .optional(),
            consultationsFee: zod_1.z
                .number()
                .min(0, {
                message: 'Consultation fee must be a non-negative number.',
            })
                .optional(),
        })
            .optional(),
        artistType: zod_1.z
            .enum(Object.values(artist_constant_1.ARTIST_TYPE))
            .optional(),
        expertise: zod_1.z
            .array(zod_1.z.enum(Object.values(artist_constant_1.expertiseTypes)))
            .optional(),
        studioName: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        location: zod_1.z
            .object({
            longitude: zod_1.z.number().min(-180).max(180),
            latitude: zod_1.z.number().min(-90).max(90),
        })
            .optional(),
    })
        .strict(),
});
const availabilitySchema = zod_1.z.object({
    body: zod_1.z.object({
        slots: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
            end: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
        }))
            .nonempty('At least one time slot is required'),
    }),
});
const timeOffSchema = zod_1.z.object({
    body: zod_1.z.object({
        dates: zod_1.z.array(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')),
    }),
});
const setOffDaysSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.coerce.date(),
        endDate: zod_1.z.coerce.date(),
    }),
});
exports.ArtistValidation = {
    artistProfileSchema,
    artistPreferencesSchema,
    artistNotificationSchema,
    artistPrivacySecuritySchema,
    updateSchema,
    availabilitySchema,
    timeOffSchema,
    setOffDaysSchema,
};

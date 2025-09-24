"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestSpotValidation = void 0;
const zod_1 = require("zod");
// createGuestSpotSchema
const createGuestSpotSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentLocation: zod_1.z.object({
            coordinates: zod_1.z
                .tuple([zod_1.z.number(), zod_1.z.number()])
                .refine((coords) => coords.length === 2, 'Coordinates must have 2 numbers!'),
            currentLocationUntil: zod_1.z.coerce.date({
                required_error: 'Current Location Until is required!',
                invalid_type_error: 'Invalid Current Location Until format!',
            }),
        }),
        startDate: zod_1.z.coerce.date({
            required_error: 'Start date is required!',
            invalid_type_error: 'Invalid start date format!',
        }),
        endDate: zod_1.z.coerce.date({
            required_error: 'End date is required!',
            invalid_type_error: 'Invalid end date format!',
        }),
        startTime: zod_1.z
            .string()
            .min(1, 'Start time is required!')
            .regex(/^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i, 'Invalid start time format!'),
        endTime: zod_1.z
            .string()
            .min(1, 'End time is required!')
            .regex(/^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i, 'Invalid end time format!'),
        offDays: zod_1.z
            .object({
            startDate: zod_1.z.coerce.date().nullable(),
            endDate: zod_1.z.coerce.date().nullable(),
        })
            .optional(),
    }),
});
// updateGuestSpotSchema
const updateGuestSpotSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentLocation: zod_1.z
            .object({
            coordinates: zod_1.z
                .tuple([zod_1.z.number(), zod_1.z.number()])
                .refine((coords) => coords.length === 2, 'Coordinates must have 2 numbers!')
                .optional(),
            currentLocationUntil: zod_1.z.coerce.date().optional(),
        })
            .optional(),
        startDate: zod_1.z.coerce
            .date({
            // required_error: 'Start date is required!',
            invalid_type_error: 'Invalid start date format!',
        })
            .optional(),
        endDate: zod_1.z.coerce
            .date({
            // required_error: 'End date is required!',
            invalid_type_error: 'Invalid end date format!',
        })
            .optional(),
        startTime: zod_1.z
            .string()
            .min(1, 'Start time is required!')
            .regex(/^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i, 'Invalid start time format!')
            .optional(),
        endTime: zod_1.z
            .string()
            .min(1, 'End time is required!')
            .regex(/^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i, 'Invalid end time format!')
            .optional(),
        offDays: zod_1.z
            .object({
            startDate: zod_1.z.coerce.date().nullable(),
            endDate: zod_1.z.coerce.date().nullable(),
        })
            .optional(),
    }),
});
exports.GuestSpotValidation = {
    createGuestSpotSchema,
    updateGuestSpotSchema,
};

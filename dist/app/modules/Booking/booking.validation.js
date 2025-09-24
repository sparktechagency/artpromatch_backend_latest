"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingValidation = void 0;
const zod_1 = require("zod");
// MongoDB ObjectId regex
// Booking validation schema
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const bookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        service: zod_1.z.string({ required_error: 'Service is required' }),
        serviceType: zod_1.z.string({ required_error: 'Service type is required' }),
        bodyLocation: zod_1.z.string({ required_error: 'Body location is required' }),
        description: zod_1.z.string({ required_error: 'Description is required' }),
        date: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, 'Invalid date format')
            .transform((str) => {
            const date = new Date(str);
            if (isNaN(date.getTime()))
                throw new Error('Invalid date string');
            return date;
        }),
        slotId: zod_1.z
            .string({ required_error: 'Slot ID is required' })
            .regex(objectIdPattern, 'Invalid slot ID format'),
        paymentIntentId: zod_1.z.string().optional(),
        transactionId: zod_1.z.string().optional(),
    }),
});
const createBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        serviceId: zod_1.z.string({ required_error: 'Service is required' }),
        preferredStartDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, 'Invalid date format')
            .transform((str) => {
            const date = new Date(str);
            if (isNaN(date.getTime()))
                throw new Error('Invalid date string');
            return date;
        }),
        preferredEndDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, 'Invalid date format')
            .transform((str) => {
            const date = new Date(str);
            if (isNaN(date.getTime()))
                throw new Error('Invalid date string');
            return date;
        }),
    }),
});
const timeString = zod_1.z
    .string()
    .regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm)$/i, 'Time must be in hh:mm am/pm format');
const createSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionId: zod_1.z.string().optional(),
        date: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, 'Invalid date format')
            .transform((str) => {
            const date = new Date(str);
            if (isNaN(date.getTime()))
                throw new Error('Invalid date string');
            return date;
        }),
        startTime: timeString,
        endTime: timeString,
    })
});
const completeSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionId: zod_1.z.string({ required_error: 'Service is required' }),
    })
});
// getAvailabilitySchema
const getAvailabilitySchema = zod_1.z.object({
    body: zod_1.z.object({
        artistId: zod_1.z.string({ required_error: 'ArtistId is required' }),
        serviceId: zod_1.z.string({ required_error: 'ServiceId is required' }),
        date: zod_1.z.string({ required_error: 'Date type is required' }),
    }),
});
exports.BookingValidation = {
    bookingSchema,
    getAvailabilitySchema,
    createBookingSchema,
    createSessionSchema,
    completeSessionSchema
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistServiceValidation = void 0;
exports.parseDurationToMinutes = parseDurationToMinutes;
const zod_1 = require("zod");
const service_interface_1 = require("./service.interface");
function parseDurationToMinutes(value) {
    const trimmed = value.trim().toLowerCase();
    const regex = /^(\d+)\s*h(?:r)?(?:\s*(\d+)\s*m)?$|^(\d+)\s*m$/;
    const match = regex.exec(trimmed);
    if (!match)
        throw new Error("Invalid duration format. Use like '2h 30m' or '45m'");
    let hours = 0;
    let minutes = 0;
    if (match[1])
        hours = parseInt(match[1], 10);
    if (match[2])
        minutes = parseInt(match[2], 10);
    if (match[3])
        minutes = parseInt(match[3], 10);
    return hours * 60 + minutes;
}
// createServiceSchema
const createServiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string({ required_error: 'Title is required' })
            .min(8, { message: 'Title must be at least 8 characters' }),
        description: zod_1.z
            .string({ required_error: 'Description is required' })
            .min(500, { message: 'Description must be at least 500 characters' })
            .max(1500, { message: 'Description must be at most 1500 characters' }),
        bodyLocation: zod_1.z.nativeEnum(service_interface_1.TattooBodyParts, {
            required_error: 'Body Location is required',
        }),
        sessionType: zod_1.z.enum(['short', 'long'], {
            required_error: 'Session Type is required',
        }),
        price: zod_1.z
            .number({ required_error: 'Price is required' })
            .min(1, { message: 'Price must be at least 1' }),
    }),
});
// updateServiceSchema
const updateServiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string({ required_error: 'Title is required' })
            .min(8, { message: 'Title must be at least 8 characters' }),
        description: zod_1.z
            .string({ required_error: 'Description is required' })
            .min(500, { message: 'Description must be at least 500 characters' })
            .max(1500, { message: 'Description must be at most 1500 characters' }),
        bodyLocation: zod_1.z.nativeEnum(service_interface_1.TattooBodyParts, {
            required_error: 'Body Location is required',
        }),
        sessionType: zod_1.z.enum(['short', 'long'], {
            required_error: 'Session Type is required',
        }),
        price: zod_1.z
            .number({ required_error: 'Price is required' })
            .min(1, { message: 'Price must be at least 1' }),
        images: zod_1.z
            .array(zod_1.z.string({ required_error: 'Image must be a string URL' }))
            .max(5, { message: 'At most 5 images are allowed!' })
            .optional(),
    }),
});
exports.ArtistServiceValidation = {
    createServiceSchema,
    updateServiceSchema,
};

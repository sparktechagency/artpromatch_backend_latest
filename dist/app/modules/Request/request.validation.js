"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestValidation = exports.createRequestSchema = void 0;
const zod_1 = require("zod");
exports.createRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        artistId: zod_1.z
            .string()
            .min(1, 'receivedId is required')
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    }),
});
exports.requestValidation = {
    createRequestSchema: exports.createRequestSchema
};

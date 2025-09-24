"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const messageSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().optional(),
        imageUrl: zod_1.z.array(zod_1.z.string()).optional(),
        audioUrl: zod_1.z.string().optional(),
        receiverId: zod_1.z.string({ required_error: "receiver id is required" }),
    }).strict({ message: 'Only text | imageUrl | audioUrl | receiverId is allowed in the request body' })
        .superRefine((data, ctx) => {
        if (!data.text?.trim() &&
            (!data.imageUrl || data.imageUrl.length === 0) &&
            !data.audioUrl?.trim()) {
            ctx.addIssue({
                code: "custom",
                message: "Either text, imageUrl, or audioUrl is required",
                path: ["text"],
            });
        }
    }),
});
const messageUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(1, 'Text is required').optional(),
    }),
});
const MessageValidationSchema = {
    messageSchema,
    messageUpdateSchema
};
exports.default = MessageValidationSchema;

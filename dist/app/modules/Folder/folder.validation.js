"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderValidation = void 0;
const zod_1 = require("zod");
const folder_constant_1 = require("./folder.constant");
// createOrUpdateFolderSchema
const createOrUpdateFolderSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: 'Folder name is required',
        })
            .min(3, 'Folder name should be at least 3 characters long')
            .max(15, 'Folder name cannot exceed 15 characters'),
        for: zod_1.z.enum(Object.values(folder_constant_1.FOLDER_FOR), {
            message: 'Invalid folder type. Please choose either "portfolio" or "flash".',
        }),
    }),
});
// removeImageFromFolderSchema
const removeImageFromFolderSchema = zod_1.z.object({
    body: zod_1.z.object({
        image: zod_1.z.string({
            required_error: 'Image is required!',
        }),
    }),
});
exports.FolderValidation = {
    createOrUpdateFolderSchema,
    removeImageFromFolderSchema,
};
// export type TFolderPayload = z.infer<typeof createFolderSchema.shape.body>;

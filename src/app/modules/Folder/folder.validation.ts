import { z } from 'zod';
import { FOLDER_FOR } from './folder.constant';

// createFolderSchema
const createFolderSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Folder name is required',
      })
      .min(3, 'Folder name should be at least 3 characters long')
      .max(15, 'Folder name cannot exceed 15 characters'),

    for: z.enum(Object.values(FOLDER_FOR) as [string, ...string[]], {
      message:
        'Invalid folder type. Please choose either "portfolio" or "flash".',
    }),
  }),
});

export const FolderValidation = {
  createFolderSchema,
};

// export type TFolderPayload = z.infer<typeof createFolderSchema.shape.body>;

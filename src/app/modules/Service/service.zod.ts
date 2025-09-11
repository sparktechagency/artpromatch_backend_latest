import { z } from 'zod';

function parseDuration(value: string): number {
  const trimmed = value.trim().toLowerCase();
  const regex = /^(\d+)\s*h(?:r)?(?:\s*(\d+)\s*m)?$|^(\d+)\s*m$/;
  const match = regex.exec(trimmed);
  if (!match)
    throw new Error("Invalid duration format. Use like '2h 30m' or '45m'");

  let hours = 0;
  let minutes = 0;

  if (match[1]) hours = parseInt(match[1], 10);
  if (match[2]) minutes = parseInt(match[2], 10);
  if (match[3]) minutes = parseInt(match[3], 10);

  return hours * 60 + minutes;
}

export const createServiceSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'Title is required',
      })
      .min(8, 'Title must be at least 8 characters'),

    description: z
      .string({
        required_error: 'Description is required',
      })
      .min(500, 'Description must be at least 500 characters')
      .max(1500, 'Description cannot exceed 1500 characters'),

    price: z
      .number({
        required_error: 'Price is required',
      })
      .min(10, 'Price must be at least 500 characters'),

    durationInMinutes: z
      .string({
        required_error: 'Duration is required',
      })
      .transform((val, ctx) => {
        try {
          return parseDuration(val); // e.g. "2h 30m" → 150
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid duration format. Use like '2h 30m' or '45m'",
          });
          return z.NEVER;
        }
      })
      .refine((val) => val >= 15 && val <= 10 * 60, {
        message: 'Duration must be between 15 minutes and 10 hours',
      }),

    bufferTimeInMinutes: z
      .string()
      .default('0m')
      .transform((val, ctx) => {
        try {
          return parseDuration(val); // e.g. "30m" → 30
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid buffer format. Use like '15m' or '1h'",
          });
          return z.NEVER;
        }
      })
      .refine((val) => val >= 0 && val <= 120, {
        message: 'Buffer time must be between 0 and 120 minutes',
      }),
  }),
});

// update service schema
export const updateServiceSchema = z.object({
  body: z.object({
    title: z.string().min(8, 'Title must be at least 8 characters').optional(),

    description: z
      .string()
      .min(500, 'Description must be at least 500 characters')
      .max(1500, 'Description cannot exceed 1500 characters')
      .optional(),

    price: z
      .number({
        required_error: 'Price is required',
      })
      .min(10, 'Price must be at least 500 characters')
      .optional(),

    durationInMinutes: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined; // handle undefined
        return parseDuration(val); // convert to minutes
      })
      .refine((val) => val === undefined || (val >= 15 && val <= 10 * 60), {
        message: 'Duration must be between 15 minutes and 8 hours',
      }),

    bufferTimeInMinutes: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined; // handle undefined
        return parseDuration(val); // convert to minutes
      })
      .refine((val) => val === undefined || (val >= 0 && val <= 120), {
        message: 'Buffer time must be between 0 and 120 minutes',
      }),
  }),
});

export const ArtistServiceValidation = {
  createServiceSchema,
  updateServiceSchema,
};

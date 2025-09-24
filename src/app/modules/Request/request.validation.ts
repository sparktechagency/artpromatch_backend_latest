import { z } from 'zod';

export const createRequestSchema = z.object({
  body: z.object({
    artistId: z
      .string()
      .min(1, 'receivedId is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  }),
});

export const requestValidation = {
    createRequestSchema
}
export type RequestPayload = z.infer<
  typeof createRequestSchema.shape.body
>;

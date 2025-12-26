import { z } from 'zod';

const createFaqSchemaByAdmin = z.object({
  body: z
    .object({
      question: z
        .string({
          required_error: 'Question is required',
          invalid_type_error: 'Question must be text',
        })
        .min(10, 'Question must be at least 10 characters long'),

      answer: z
        .string({
          required_error: 'Answer is required',
          invalid_type_error: 'Answer must be text',
        })
        .min(20, 'Answer must be at least 20 characters long'),

      isPublished: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    })
    .strict({ message: 'Unexpected field injected' }),
});

const createFaqSchemaByUser = z.object({
  body: z
    .object({
      question: z
        .string({
          required_error: 'Question is required',
          invalid_type_error: 'Question must be text',
        })
        .min(10, 'Question must be at least 10 characters long'),
    })
    .strict({ message: 'Unexpected field injected' }),
});

const updateFaqSchema = z.object({
  body: z
    .object({
      question: z
        .string()
        .min(10, 'Question must be at least 10 characters long')
        .optional(),

      answer: z
        .string()
        .min(20, 'Answer must be at least 20 characters long')
        .optional(),

      isPublished: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    })
    .refine(
      (data) =>
        data.question !== undefined ||
        data.answer !== undefined ||
        data.isPublished !== undefined,
      {
        message:
          'At least one field (question, answer, or isActive) must be provided',
        path: ['body'],
      }
    ),
});

export type TCreateFaqPayload = z.infer<
  typeof createFaqSchemaByAdmin.shape.body
>;

export type TUpdatedFaqPayload = z.infer<typeof updateFaqSchema.shape.body>;

export const FaqValidation = {
  createFaqSchemaByAdmin,
  createFaqSchemaByUser,
  updateFaqSchema,
};

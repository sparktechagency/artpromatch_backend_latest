import { z } from 'zod';

// MongoDB ObjectId regex
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Booking validation schema
const bookingSchema = z.object({
  body: z.object({
    service: z.string({ required_error: 'Service is required' }),
    serviceType: z.string({ required_error: 'Service type is required' }),
    bodyLocation: z.string({ required_error: 'Body location is required' }),
    description: z.string({ required_error: 'Description is required' }),

    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
        'Invalid date format'
      )
      .transform((str) => {
        const date = new Date(str);
        if (isNaN(date.getTime())) throw new Error('Invalid date string');
        return date;
      }),

    slotId: z
      .string({ required_error: 'Slot ID is required' })
      .regex(objectIdPattern, 'Invalid slot ID format'),

    paymentIntentId: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});

// getAvailabilitySchema
const getAvailabilitySchema = z.object({
  body: z.object({
    artistId: z.string({ required_error: 'ArtistId is required' }),
    serviceId: z.string({ required_error: 'ServiceId is required' }),
    date: z.string({ required_error: 'Date type is required' }),
  }),
});

export const BookingValidation = {
  bookingSchema,
  getAvailabilitySchema,
};

export type TBookingData = z.infer<typeof bookingSchema.shape.body>;

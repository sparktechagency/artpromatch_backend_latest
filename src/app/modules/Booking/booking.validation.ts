import { z } from 'zod';

// MongoDB ObjectId regex


// Booking validation schema

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
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



const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string({ required_error: 'Service is required' }),
    preferredStartDate: z
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
    preferredEndDate: z
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

  }),
});

const timeString = z
  .string()
  .regex(
    /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm)$/i,
    'Time must be in hh:mm am/pm format'
  );
const createSessionSchema = z.object({
  body: z.object({
      sessionId: z.string().optional(),
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

    startTime: timeString,
    endTime: timeString,
     
  })
})


const completeSessionSchema = z.object({
  body: z.object({
      sessionId: z.string({ required_error: 'Service is required' }),
  })
})


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
  createBookingSchema,
  createSessionSchema,
  completeSessionSchema
};

export type TBookingData = z.infer<typeof createBookingSchema.shape.body>;

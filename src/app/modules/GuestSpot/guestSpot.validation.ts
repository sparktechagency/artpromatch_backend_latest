import { z } from 'zod';

// createGuestSpotSchema
const createGuestSpotSchema = z.object({
  body: z.object({
    currentLocation: z.object({
      coordinates: z
        .tuple([z.number(), z.number()])
        .refine(
          (coords) => coords.length === 2,
          'Coordinates must have 2 numbers!'
        ),
      currentLocationUntil: z.coerce.date({
        required_error: 'Current Location Until is required!',
        invalid_type_error: 'Invalid Current Location Until format!',
      }),
    }),

    startDate: z.coerce.date({
      required_error: 'Start date is required!',
      invalid_type_error: 'Invalid start date format!',
    }),

    endDate: z.coerce.date({
      required_error: 'End date is required!',
      invalid_type_error: 'Invalid end date format!',
    }),

    startTime: z
      .string()
      .min(1, 'Start time is required!')
      .regex(
        /^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i,
        'Invalid start time format!'
      ),

    endTime: z
      .string()
      .min(1, 'End time is required!')
      .regex(
        /^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i,
        'Invalid end time format!'
      ),

    offDays: z
      .object({
        startDate: z.coerce.date().nullable(),
        endDate: z.coerce.date().nullable(),
      })
      .optional(),
  }),
});

// updateGuestSpotSchema
const updateGuestSpotSchema = z.object({
  body: z.object({
    currentLocation: z
      .object({
        coordinates: z
          .tuple([z.number(), z.number()])
          .refine(
            (coords) => coords.length === 2,
            'Coordinates must have 2 numbers!'
          )
          .optional(),

        currentLocationUntil: z.coerce.date().optional(),
      })
      .optional(),

    startDate: z.coerce
      .date({
        // required_error: 'Start date is required!',
        invalid_type_error: 'Invalid start date format!',
      })
      .optional(),

    endDate: z.coerce
      .date({
        // required_error: 'End date is required!',
        invalid_type_error: 'Invalid end date format!',
      })
      .optional(),

    startTime: z
      .string()
      .min(1, 'Start time is required!')
      .regex(
        /^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i,
        'Invalid start time format!'
      )
      .optional(),

    endTime: z
      .string()
      .min(1, 'End time is required!')
      .regex(
        /^([0-9]{1,2})(:[0-9]{2})?\s?(am|pm)$/i,
        'Invalid end time format!'
      )
      .optional(),

    offDays: z
      .object({
        startDate: z.coerce.date().nullable(),
        endDate: z.coerce.date().nullable(),
      })
      .optional(),
  }),
});

export const GuestSpotValidation = {
  createGuestSpotSchema,
  updateGuestSpotSchema,
};

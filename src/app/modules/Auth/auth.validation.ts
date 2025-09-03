import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';
import { ARTIST_TYPE, expertiseTypes } from '../Artist/artist.constant';
import {
  OPERATING_DAYS,
  SERVICES_OFFERED,
} from '../Business/business.constants';
import { favoriteTattoos, serviceTypes } from '../Client/client.constant';
import { ROLE } from './auth.constant';

// Reusable validators
export const zodEnumFromObject = <T extends Record<string, string>>(obj: T) =>
  z.enum([...Object.values(obj)] as [string, ...string[]]);

// createAuthSchema
const createAuthSchema = z.object({
  body: z.object({
    fullName: z
      .string({
        required_error: 'Full name is required',
      })
      .min(3, { message: 'Full name must be at least 3 characters long' })
      .max(30, { message: 'Full name cannot exceed 30 characters' })
      .regex(/^[a-zA-Z\s]+$/, {
        message: 'Full name can only contain letters and spaces',
      }),

    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),

    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(20, { message: 'Password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'Password must contain at least one special character',
      }),

    phoneNumber: z.string().refine(
      (val) => {
        const parsed = parsePhoneNumberFromString(val);
        return parsed?.isValid();
      },
      {
        message: 'Phone number must be a valid international format',
      }
    ),
  }),
});

// saveAuthDataSchema
const saveAuthDataSchema = z.object({
  body: z.object({
    otp: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(6, { message: 'Password cannot exceed 6 characters' }),
  }),
});

// sendSignupOtpAgainSchema
const sendSignupOtpAgainSchema = z.object({
  body: z.object({
    userEmail: z
      .string({
        required_error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
  }),
});

// signinSchema
const signinSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(20, { message: 'Password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'Password must contain at least one special character',
      }),
  }),
});

// updateProfileSchema
const updateProfileSchema = z.object({
  body: z
    .object({
      role: z.enum(['CLIENT', 'ARTIST', 'BUSINESS'], {
        required_error: 'Role is required',
        invalid_type_error: 'Role must be CLIENT, ARTIST or BUSINESS',
      }),

      location: z.object({
        type: z.literal('Point').default('Point'), // Type must be 'Point'
        coordinates: z
          .array(z.number()) // Coordinates should be an array of numbers
          .length(2) // There should be exactly two numbers (longitude, latitude)
          .refine(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([longitude, latitude]) => longitude >= -180 && longitude <= 180,
            {
              message: 'Longitude must be between -180 and 180',
            }
          )
          .refine(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([longitude, latitude]) => latitude >= -90 && latitude <= 90,
            {
              message: 'Latitude must be between -90 and 90',
            }
          ),
      }), // The entire location object is optional
      radius: z.number().min(0),
      lookingFor: z.array(zodEnumFromObject(serviceTypes)),
      favoriteTattoos: z.array(zodEnumFromObject(favoriteTattoos)),

      notificationPreferences: z
        .union([z.literal('app'), z.literal('email'), z.literal('sms')])
        .array(),
      artistType: zodEnumFromObject(ARTIST_TYPE),
      expertise: z.array(zodEnumFromObject(expertiseTypes)),
      studioName: z.string(),
      city: z.string(),

      // NEW for BUSINESS
      businessType: z.enum(['Studio', 'Event Organizer', 'Both']),
      servicesOffered: z.array(zodEnumFromObject(SERVICES_OFFERED)),
      contactNumber: z.string(),
      contactEmail: z.string().email('Invalid email address'),

      // Operating Hours (Weekly)
      operatingHours: z.record(
        zodEnumFromObject(OPERATING_DAYS),
        z.array(
          z
            .object({
              start: z.string().regex(/^\d{2}:\d{2}$/, {
                message: 'Invalid time format. Use HH:MM.',
              }),
              end: z.string().regex(/^\d{2}:\d{2}$/, {
                message: 'Invalid time format. Use HH:MM.',
              }),
            })
            .refine(
              (val) => {
                const [sh, sm] = val.start.split(':').map(Number);
                const [eh, em] = val.end.split(':').map(Number);
                return eh > sh || (eh === sh && em > sm);
              },
              {
                message: 'End time must be after start time.',
                path: ['end'],
              }
            )
        )
      ),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.role === ROLE.ARTIST) {
        if (!data.artistType) {
          ctx.addIssue({
            path: ['artistType'],
            code: z.ZodIssueCode.custom,
            message: 'Artist type is required.',
          });
        }

        if (!data.expertise || data.expertise.length === 0) {
          ctx.addIssue({
            path: ['expertise'],
            code: z.ZodIssueCode.custom,
            message: 'Please select at least one expertise.',
          });
        }

        if (!data.studioName) {
          ctx.addIssue({
            path: ['studioName'],
            code: z.ZodIssueCode.custom,
            message: 'Studio name is required.',
          });
        }

        if (!data.city) {
          ctx.addIssue({
            path: ['city'],
            code: z.ZodIssueCode.custom,
            message: 'City is required.',
          });
        }

        if (!data.location) {
          ctx.addIssue({
            path: ['location'],
            code: z.ZodIssueCode.custom,
            message: 'Location is required.',
          });
        }
      }

      if (data.role === ROLE.BUSINESS) {
        if (!data.studioName) {
          ctx.addIssue({
            path: ['studioName'],
            code: z.ZodIssueCode.custom,
            message: 'Business name is required.',
          });
        }

        if (!data.businessType) {
          ctx.addIssue({
            path: ['businessType'],
            code: z.ZodIssueCode.custom,
            message: 'Please select business type.',
          });
        }

        if (!data.servicesOffered || data.servicesOffered.length === 0) {
          ctx.addIssue({
            path: ['servicesOffered'],
            code: z.ZodIssueCode.custom,
            message: 'Select at least one service offered.',
          });
        }

        if (!data.location) {
          ctx.addIssue({
            path: ['location'],
            code: z.ZodIssueCode.custom,
            message: 'Primary location is required.',
          });
        }

        if (!data.contactNumber) {
          ctx.addIssue({
            path: ['contactNumber'],
            code: z.ZodIssueCode.custom,
            message: 'Phone number is required.',
          });
        }

        if (!data.contactEmail) {
          ctx.addIssue({
            path: ['contactEmail'],
            code: z.ZodIssueCode.custom,
            message: 'Email address is required.',
          });
        }
      }
    }),
});

// passwordChangeSchema
const passwordChangeSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({
        required_error: 'Old password is required',
      })
      .min(6, { message: 'Old password must be at least 6 characters long' })
      .max(20, { message: 'Old password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'Old password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Old password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'Old password must contain at least one special character',
      }),
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, { message: 'New password must be at least 6 characters long' })
      .max(20, { message: 'New password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'New password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'New password must contain at least one special character',
      }),
  }),
});

// otpSchema
const otpSchema = z.object({
  body: z.object({
    otp: z
      .string({
        required_error: 'OTP is required',
      })
      .regex(/^\d+$/, { message: 'OTP must be a number' })
      .length(6, { message: 'OTP must be exactly 6 digits' }),
  }),
});

// forgetPasswordVerifySchema
const forgetPasswordVerifySchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Token is required' }),
    otp: z
      .string({
        required_error: 'OTP is required',
      })
      .regex(/^\d+$/, { message: 'OTP must be a number' })
      .length(6, { message: 'OTP must be exactly 6 digits' }),
  }),
});

// forgetPasswordSchema
const forgetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
  }),
});

// resetPasswordSchema
const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, { message: 'New password must be at least 6 characters long' })
      .max(20, { message: 'New password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'New password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, {
        message: 'New password must contain at least one number',
      })
      .regex(/[@$!%*?&#]/, {
        message: 'New password must contain at least one special character',
      }),
  }),
});

// resendOtpSchema
const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
  }),
});

// refreshTokenSchema
const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token is required!',
    }),
  }),
});

// userDeactivationSchema
const userDeactivationSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email'),
      password: z.string(),
      deactivationReason: z
        .string()
        .min(3, 'Reason must be at least 3 characters'),
    })
    .strict(),
});

// accessTokenSchema
const accessTokenSchema = z.object({
  cookies: z.object({
    accessToken: z.string({
      required_error: 'Refresh token is required!',
    }),
  }),
});

// socialSchema
const socialSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .nonempty('Email is required'),
    fcmToken: z.string().nonempty('FCM Token is required'),
    image: z.string().url('Image URL must be a valid URL'),
    fullName: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
  }),
});

export type TProfilePayload = z.infer<typeof updateProfileSchema.shape.body>;

export const AuthValidation = {
  createAuthSchema,
  saveAuthDataSchema,
  sendSignupOtpAgainSchema,
  signinSchema,
  updateProfileSchema,
  passwordChangeSchema,
  otpSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  resendOtpSchema,
  refreshTokenSchema,
  accessTokenSchema,
  socialSchema,
  forgetPasswordVerifySchema,
  userDeactivationSchema,
};

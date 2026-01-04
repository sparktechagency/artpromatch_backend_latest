import { favoriteTattoos, lookingForTypes } from '../Client/client.constant';
import { ARTIST_TYPE, expertiseTypes } from '../Artist/artist.constant';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ROLE } from './auth.constant';
import {
  OPERATING_DAYS,
  SERVICES_OFFERED,
} from '../Business/business.constants';
import { z } from 'zod';

// Reusable validators
export const zodEnumFromObject = <T extends Record<string, string>>(obj: T) =>
  z.enum([...Object.values(obj)] as [string, ...string[]]);

// 1. createAuthSchema
const createAuthSchema = z.object({
  body: z.object({
    fullName: z
      .string({
        required_error: 'Full name is required!',
      })
      .min(3, { message: 'Full name must be at least 3 characters long!' })
      .max(30, { message: 'Full name cannot exceed 30 characters!' })
      .regex(/^[a-zA-Z\s]+$/, {
        message: 'Full name can only contain letters and spaces!',
      }),

    email: z
      .string({
        required_error: 'Email is required!',
      })
      .trim()
      .email({ message: 'Invalid email format!' })
      .toLowerCase(),

    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, { message: 'Password must be at least 8 characters long!' })
      .max(20, { message: 'Password cannot exceed 20 characters!' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter!',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter!',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number!' })
      .regex(/[@$!%*?&#]/, {
        message: 'Password must contain at least one special character!',
      }),

    phoneNumber: z.string().refine(
      (val) => {
        const parsed = parsePhoneNumberFromString(val);
        return parsed?.isValid();
      },
      {
        message: 'Phone number must be a valid international format!',
      }
    ),

    fcmToken: z.string({
      required_error: 'Fcm Token is required!',
      invalid_type_error: 'Fcm Token must be string!',
    }),
  }),
});

// 2. sendSignupOtpAgainSchema
const sendSignupOtpAgainSchema = z.object({
  body: z.object({
    userEmail: z
      .string({
        required_error: 'Email is required!',
      })
      .trim()
      .email({ message: 'Invalid email format!' })
      .toLowerCase(),
  }),
});

// 3. verifySignupOtpSchema
const verifySignupOtpSchema = z.object({
  body: z.object({
    userEmail: z
      .string({
        required_error: 'Email is required!',
      })
      .trim()
      .email({ message: 'Invalid email format!' })
      .toLowerCase(),
    otp: z
      .string({
        required_error: 'Password is required!',
      })
      .min(6, { message: 'Password must be at least 6 characters long!' })
      .max(6, { message: 'Password cannot exceed 6 characters!' }),
  }),
});

// 4. signinSchema
const signinSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .trim()
      .email({ message: 'Invalid email format!' })
      .toLowerCase(),

    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, { message: 'Password must be at least 8 characters long!' })
      .max(20, { message: 'Password cannot exceed 20 characters!' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter!',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter!',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number!' })
      .regex(/[@$!%*?&#]/, {
        message: 'Password must contain at least one special character!',
      }),

    fcmToken: z.string({
      required_error: 'Fcm Token is required!',
      invalid_type_error: 'Fcm Token must be string!',
    }),
  }),
});

// 5. createProfileSchema
const createProfileSchema = z.object({
  body: z
    .object({
      role: z.enum(['CLIENT', 'ARTIST', 'BUSINESS'], {
        required_error: 'Role is required!',
        invalid_type_error: 'Role must be CLIENT, ARTIST or BUSINESS!',
      }),

      stringLocation: z.string({
        invalid_type_error: 'Address must be a  string!',
        required_error: 'Address is required!',
      }),

      mainLocation: z
        .object({
          // type: z.literal('Point').default('Point'), // Type must be 'Point'
          coordinates: z
            .array(z.number()) // Coordinates should be an array of numbers
            .length(2) // There should be exactly two numbers (longitude, latitude)
            .refine(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ([longitude, latitude]) => longitude >= -180 && longitude <= 180,
              {
                message: 'Longitude must be between -180 and 180!',
              }
            )
            .refine(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ([longitude, latitude]) => latitude >= -90 && latitude <= 90,
              {
                message: 'Latitude must be between -90 and 90!',
              }
            ),
        })
        .optional(),

      // For CLIENT
      radius: z.number().min(0).optional(),
      lookingFor: z.array(zodEnumFromObject(lookingForTypes)).optional(),
      favoriteTattoos: z.array(zodEnumFromObject(favoriteTattoos)).optional(),
      // favoritePiercing: z.array(zodEnumFromObject(favoritePiercings)).optional(),
      notificationPreferences: z
        .union([z.literal('app'), z.literal('email'), z.literal('sms')])
        .array()
        .optional(),

      // For ARTIST
      artistType: zodEnumFromObject(ARTIST_TYPE).optional(),
      expertise: z.array(zodEnumFromObject(expertiseTypes)).optional(),
      description: z.string().optional(),
      hourlyRate: z.string().optional(),
      // city: z.string().optional(),

      // For BUSINESS
      studioName: z.string().optional(),
      businessType: z.enum(['Studio', 'Event Organizer', 'Both']).optional(),
      servicesOffered: z.array(zodEnumFromObject(SERVICES_OFFERED)).optional(),
      contactNumber: z.string().optional(),
      contactEmail: z
        .string()
        .trim()
        .email('Invalid email address!')
        .optional(),
      // Operating Hours (Weekly)
      operatingHours: z
        .record(
          zodEnumFromObject(OPERATING_DAYS),
          z.array(
            z
              .object({
                start: z.string().regex(/^\d{2}:\d{2}$/, {
                  message: 'Invalid time format. Use HH:MM!',
                }),
                end: z.string().regex(/^\d{2}:\d{2}$/, {
                  message: 'Invalid time format. Use HH:MM!',
                }),
              })
              .refine(
                (val) => {
                  const [sh, sm] = val.start.split(':').map(Number);
                  const [eh, em] = val.end.split(':').map(Number);
                  return eh > sh || (eh === sh && em > sm);
                },
                {
                  message: 'End time must be after start time!',
                  path: ['end'],
                }
              )
          )
        )
        .optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.role === ROLE.ARTIST) {
        if (!data.artistType?.trim()) {
          ctx.addIssue({
            path: ['artistType'],
            code: z.ZodIssueCode.custom,
            message: 'Artist type is required!',
          });
        }

        if (!data.expertise || data.expertise.length === 0) {
          ctx.addIssue({
            path: ['expertise'],
            code: z.ZodIssueCode.custom,
            message: 'Please select at least one expertise!',
          });
        }

        // if (!data.studioName) {
        //   ctx.addIssue({
        //     path: ['studioName'],
        //     code: z.ZodIssueCode.custom,
        //     message: 'Studio name is required!',
        //   });
        // }

        // if (!data.city) {
        //   ctx.addIssue({
        //     path: ['city'],
        //     code: z.ZodIssueCode.custom,
        //     message: 'City is required!',
        //   });
        // }

        if (!data.mainLocation) {
          ctx.addIssue({
            path: ['mainLocation'],
            code: z.ZodIssueCode.custom,
            message: 'Main Location is required!',
          });
        }
      }

      if (data.role === ROLE.BUSINESS) {
        if (!data.studioName) {
          ctx.addIssue({
            path: ['studioName'],
            code: z.ZodIssueCode.custom,
            message: 'Business name is required!',
          });
        }

        if (!data.businessType?.trim()) {
          ctx.addIssue({
            path: ['businessType'],
            code: z.ZodIssueCode.custom,
            message: 'Please select business type!',
          });
        }

        if (!data.servicesOffered || data.servicesOffered.length === 0) {
          ctx.addIssue({
            path: ['servicesOffered'],
            code: z.ZodIssueCode.custom,
            message: 'Select at least one service offered!',
          });
        }

        if (!data.mainLocation) {
          ctx.addIssue({
            path: ['mainLocation'],
            code: z.ZodIssueCode.custom,
            message: 'Main Location is required!',
          });
        }

        if (!data.contactNumber?.trim()) {
          ctx.addIssue({
            path: ['contactNumber'],
            code: z.ZodIssueCode.custom,
            message: 'Phone number is required!',
          });
        }

        if (!data.contactEmail?.trim()) {
          ctx.addIssue({
            path: ['contactEmail'],
            code: z.ZodIssueCode.custom,
            message: 'Email address is required!',
          });
        } else {
          data?.contactEmail?.toLowerCase();
        }
      }
    }),
});

// 6. socialSigninSchema
const socialSigninSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .trim()
      .email({ message: 'Invalid email format!' })
      .nonempty('Email is required!')
      .toLowerCase(),
    fcmToken: z.string().nonempty('FCM Token is required!'),
    image: z.string().url('Image URL must be a valid URL!'),
    fullName: z.string(),
    address: z.string(),
  }),
});

// 8. changePasswordSchema
const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({
        required_error: 'Old password is required!',
      })
      .min(8, { message: 'Old password must be at least 8 characters long!' })
      .max(20, { message: 'Old password cannot exceed 20 characters!' })
      .regex(/[A-Z]/, {
        message: 'Old password must contain at least one uppercase letter!',
      })
      .regex(/[a-z]/, {
        message: 'Old password must contain at least one lowercase letter!',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number!' })
      .regex(/[@$!%*?&#]/, {
        message: 'Old password must contain at least one special character!',
      }),

    newPassword: z
      .string({
        required_error: 'New password is required!',
      })
      .min(8, { message: 'New password must be at least 8 characters long!' })
      .max(20, { message: 'New password cannot exceed 20 characters!' })
      .regex(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter!',
      })
      .regex(/[a-z]/, {
        message: 'New password must contain at least one lowercase letter!',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number!' })
      .regex(/[@$!%*?&#]/, {
        message: 'New password must contain at least one special character!',
      }),
  }),
});

// 9. forgotPasswordSchema
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({ message: 'Invalid email format!' })
      .toLowerCase(),
  }),
});

// 9. sendForgotPasswordOtpAgainSchema
const sendForgotPasswordOtpAgainSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Token is required!' }),
  }),
});

// 10. verifyOtpForForgotPasswordSchema
const verifyOtpForForgotPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Token is required!' }),
    otp: z
      .string({
        required_error: 'OTP is required!',
      })
      .regex(/^\d+$/, { message: 'OTP must be a number!' })
      .length(6, { message: 'OTP must be exactly 6 digits!' }),
  }),
});

// 11. resetPasswordSchema
const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string({
        required_error: 'New password is required!',
      })
      .min(8, { message: 'New password must be at least 8 characters long!' })
      .max(20, { message: 'New password cannot exceed 20 characters!' })
      .regex(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter!',
      })
      .regex(/[a-z]/, {
        message: 'New password must contain at least one lowercase letter!',
      })
      .regex(/[0-9]/, {
        message: 'New password must contain at least one number!',
      })
      .regex(/[@$!%*?&#]/, {
        message: 'New password must contain at least one special character!',
      }),
  }),
});

// 14. deactivateUserAccountSchema
const deactivateUserAccountSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: 'Email is required!',
        })
        .email({ message: 'Invalid email format!' })
        .toLowerCase(),

      password: z.string({
        required_error: 'Password is required!',
      }),

      deactivationReason: z
        .string()
        .min(3, 'Reason must be at least 3 characters!'),
    })
    .strict(),
});

// 14. deleteUserAccountSchema
const deleteUserAccountSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: 'Email is required!',
        })
        .email({ message: 'Invalid email format!' })
        .toLowerCase(),

      password: z.string(),
    })
    .strict(),
});

// 16. getAccessTokenSchema
// const getAccessTokenSchema = z.object({
//   cookies: z.object({
//     refreshToken: z.string({
//       required_error: 'Refresh token is required!',
//     }),
//   }),
// });

// 17. updateAuthDataSchema
const updateAuthDataSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: 'Full Name is required!',
      invalid_type_error: 'Full Name must be string!',
    }),

    stringLocation: z.string({
      required_error: 'Address is required!',
      invalid_type_error: 'Address must be string!',
    }),

    latitude: z.coerce.number({
      required_error: 'Latitude is required!',
      invalid_type_error: 'Latitude must be string!',
    }),

    longitude: z.coerce.number({
      required_error: 'Longitude is required!',
      invalid_type_error: 'Longitude must be string!',
    }),
  }),
});

// updateFcmTokenSchema
const updateFcmTokenSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'UserId is required!',
      invalid_type_error: 'UserId must be string!',
    }),

    fcmToken: z.string({
      required_error: 'Fcm Token is required!',
      invalid_type_error: 'Fcm Token must be string!',
    }),
  }),
});

// getUserForConversationSchema
const getUserForConversationSchema = z.object({
  query: z.object({
    term: z
      .string({
        required_error: 'Search Term is required!',
        invalid_type_error: 'Search Term must be a string!',
      })
      .trim(),
  }),
});

// // resendOtpSchema
// const resendOtpSchema = z.object({
//   body: z.object({
//     email: z
//       .string({
//         required_error: 'Email is required!',
//       })
//       .email({ message: 'Invalid email format!' }),
//   }),
// });

// // accessTokenSchema
// const accessTokenSchema = z.object({
//   cookies: z.object({
//     accessToken: z.string({
//       required_error: 'Refresh token is required!',
//     }),
//   }),
// });

// // otpSchema
// const otpSchema = z.object({
//   body: z.object({
//     otp: z
//       .string({
//         required_error: 'OTP is required!',
//       })
//       .regex(/^\d+$/, { message: 'OTP must be a number!' })
//       .length(6, { message: 'OTP must be exactly 6 digits!' }),
//   }),
// });

export type TProfilePayload = z.infer<typeof createProfileSchema.shape.body>;

export const AuthValidation = {
  createAuthSchema,
  sendSignupOtpAgainSchema,
  verifySignupOtpSchema,
  signinSchema,
  createProfileSchema,
  socialSigninSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  sendForgotPasswordOtpAgainSchema,
  verifyOtpForForgotPasswordSchema,
  resetPasswordSchema,
  deactivateUserAccountSchema,
  deleteUserAccountSchema,
  // getAccessTokenSchema,
  updateAuthDataSchema,
  updateFcmTokenSchema,
  getUserForConversationSchema,
  // resendOtpSchema,
  // accessTokenSchema,
  // otpSchema,
};

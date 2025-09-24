"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = exports.zodEnumFromObject = void 0;
const libphonenumber_js_1 = require("libphonenumber-js");
const zod_1 = require("zod");
const artist_constant_1 = require("../Artist/artist.constant");
const business_constants_1 = require("../Business/business.constants");
const client_constant_1 = require("../Client/client.constant");
const auth_constant_1 = require("./auth.constant");
// Reusable validators
const zodEnumFromObject = (obj) => zod_1.z.enum([...Object.values(obj)]);
exports.zodEnumFromObject = zodEnumFromObject;
// 1. createAuthSchema
const createAuthSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z
            .string({
            required_error: 'Full name is required',
        })
            .min(3, { message: 'Full name must be at least 3 characters long' })
            .max(30, { message: 'Full name cannot exceed 30 characters' })
            .regex(/^[a-zA-Z\s]+$/, {
            message: 'Full name can only contain letters and spaces',
        }),
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({ message: 'Invalid email format' }),
        password: zod_1.z
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
        phoneNumber: zod_1.z.string().refine((val) => {
            const parsed = (0, libphonenumber_js_1.parsePhoneNumberFromString)(val);
            return parsed?.isValid();
        }, {
            message: 'Phone number must be a valid international format',
        }),
        fcmToken: zod_1.z.string({
            required_error: 'Fcm Token is required',
            invalid_type_error: 'Fcm Token must be string',
        }),
    }),
});
// 2. sendSignupOtpAgainSchema
const sendSignupOtpAgainSchema = zod_1.z.object({
    body: zod_1.z.object({
        userEmail: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({ message: 'Invalid email format' }),
    }),
});
// 3. verifySignupOtpSchema
const verifySignupOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        userEmail: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({ message: 'Invalid email format' }),
        otp: zod_1.z
            .string({
            required_error: 'Password is required',
        })
            .min(6, { message: 'Password must be at least 6 characters long' })
            .max(6, { message: 'Password cannot exceed 6 characters' }),
    }),
});
// 4. signinSchema
const signinSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({ message: 'Invalid email format' }),
        password: zod_1.z
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
        fcmToken: zod_1.z.string({
            required_error: 'Fcm Token is required',
            invalid_type_error: 'Fcm Token must be string',
        }),
    }),
});
// 5. createProfileSchema
const createProfileSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        role: zod_1.z.enum(['CLIENT', 'ARTIST', 'BUSINESS'], {
            required_error: 'Role is required',
            invalid_type_error: 'Role must be CLIENT, ARTIST or BUSINESS',
        }),
        mainLocation: zod_1.z
            .object({
            // type: z.literal('Point').default('Point'), // Type must be 'Point'
            coordinates: zod_1.z
                .array(zod_1.z.number()) // Coordinates should be an array of numbers
                .length(2) // There should be exactly two numbers (longitude, latitude)
                .refine(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([longitude, latitude]) => longitude >= -180 && longitude <= 180, {
                message: 'Longitude must be between -180 and 180',
            })
                .refine(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([longitude, latitude]) => latitude >= -90 && latitude <= 90, {
                message: 'Latitude must be between -90 and 90',
            }),
        })
            .optional(),
        // For CLIENT
        radius: zod_1.z.number().min(0).optional(),
        lookingFor: zod_1.z.array((0, exports.zodEnumFromObject)(client_constant_1.serviceTypes)).optional(),
        favoriteTattoos: zod_1.z.array((0, exports.zodEnumFromObject)(client_constant_1.favoriteTattoos)).optional(),
        notificationPreferences: zod_1.z
            .union([zod_1.z.literal('app'), zod_1.z.literal('email'), zod_1.z.literal('sms')])
            .array()
            .optional(),
        // For ARTIST
        artistType: (0, exports.zodEnumFromObject)(artist_constant_1.ARTIST_TYPE).optional(),
        expertise: zod_1.z.array((0, exports.zodEnumFromObject)(artist_constant_1.expertiseTypes)).optional(),
        studioName: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        // For BUSINESS
        businessType: zod_1.z.enum(['Studio', 'Event Organizer', 'Both']).optional(),
        servicesOffered: zod_1.z.array((0, exports.zodEnumFromObject)(business_constants_1.SERVICES_OFFERED)).optional(),
        contactNumber: zod_1.z.string().optional(),
        contactEmail: zod_1.z.string().email('Invalid email address').optional(),
        // Operating Hours (Weekly)
        operatingHours: zod_1.z
            .record((0, exports.zodEnumFromObject)(business_constants_1.OPERATING_DAYS), zod_1.z.array(zod_1.z
            .object({
            start: zod_1.z.string().regex(/^\d{2}:\d{2}$/, {
                message: 'Invalid time format. Use HH:MM.',
            }),
            end: zod_1.z.string().regex(/^\d{2}:\d{2}$/, {
                message: 'Invalid time format. Use HH:MM.',
            }),
        })
            .refine((val) => {
            const [sh, sm] = val.start.split(':').map(Number);
            const [eh, em] = val.end.split(':').map(Number);
            return eh > sh || (eh === sh && em > sm);
        }, {
            message: 'End time must be after start time.',
            path: ['end'],
        })))
            .optional(),
    })
        .strict()
        .superRefine((data, ctx) => {
        if (data.role === auth_constant_1.ROLE.ARTIST) {
            if (!data.artistType) {
                ctx.addIssue({
                    path: ['artistType'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Artist type is required.',
                });
            }
            if (!data.expertise || data.expertise.length === 0) {
                ctx.addIssue({
                    path: ['expertise'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Please select at least one expertise.',
                });
            }
            if (!data.studioName) {
                ctx.addIssue({
                    path: ['studioName'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Studio name is required.',
                });
            }
            if (!data.city) {
                ctx.addIssue({
                    path: ['city'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'City is required.',
                });
            }
            if (!data.mainLocation) {
                ctx.addIssue({
                    path: ['location'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Location is required.',
                });
            }
        }
        if (data.role === auth_constant_1.ROLE.BUSINESS) {
            if (!data.studioName) {
                ctx.addIssue({
                    path: ['studioName'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Business name is required.',
                });
            }
            if (!data.businessType) {
                ctx.addIssue({
                    path: ['businessType'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Please select business type.',
                });
            }
            if (!data.servicesOffered || data.servicesOffered.length === 0) {
                ctx.addIssue({
                    path: ['servicesOffered'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Select at least one service offered.',
                });
            }
            if (!data.mainLocation) {
                ctx.addIssue({
                    path: ['location'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Primary location is required.',
                });
            }
            if (!data.contactNumber) {
                ctx.addIssue({
                    path: ['contactNumber'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Phone number is required.',
                });
            }
            if (!data.contactEmail) {
                ctx.addIssue({
                    path: ['contactEmail'],
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Email address is required.',
                });
            }
        }
    }),
});
// 6. socialSigninSchema
const socialSigninSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Invalid email address')
            .nonempty('Email is required'),
        fcmToken: zod_1.z.string().nonempty('FCM Token is required'),
        image: zod_1.z.string().url('Image URL must be a valid URL'),
        fullName: zod_1.z.string(),
        phoneNumber: zod_1.z.string(),
        address: zod_1.z.string(),
    }),
});
// 8. changePasswordSchema
const changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        oldPassword: zod_1.z
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
        newPassword: zod_1.z
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
// 9. forgetPasswordSchema
const forgetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({ message: 'Invalid email format' }),
    }),
});
// 10. verifyOtpForForgetPasswordSchema
const verifyOtpForForgetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string({ required_error: 'Token is required' }),
        otp: zod_1.z
            .string({
            required_error: 'OTP is required',
        })
            .regex(/^\d+$/, { message: 'OTP must be a number' })
            .length(6, { message: 'OTP must be exactly 6 digits' }),
    }),
});
// 11. resetPasswordSchema
const resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z
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
// 14. deactivateUserAccountSchema
const deactivateUserAccountSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        email: zod_1.z.string().email('Invalid email'),
        password: zod_1.z.string(),
        deactivationReason: zod_1.z
            .string()
            .min(3, 'Reason must be at least 3 characters'),
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
const updateAuthDataSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string({
            required_error: 'Full Name is required!',
            invalid_type_error: 'Full Name must be string!',
        }),
    }),
});
exports.AuthValidation = {
    createAuthSchema,
    sendSignupOtpAgainSchema,
    verifySignupOtpSchema,
    signinSchema,
    createProfileSchema,
    socialSigninSchema,
    changePasswordSchema,
    forgetPasswordSchema,
    verifyOtpForForgetPasswordSchema,
    resetPasswordSchema,
    deactivateUserAccountSchema,
    // getAccessTokenSchema,
    updateAuthDataSchema,
    // resendOtpSchema,
    // accessTokenSchema,
    // otpSchema,
};

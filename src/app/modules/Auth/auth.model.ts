import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import config from '../../config';
import { defaultUserImage, ROLE } from './auth.constant';
import { IAuth, IAuthModel } from './auth.interface';

const authSchema = new mongoose.Schema<IAuth, IAuthModel>(
  {
    email: {
      type: String,
      required: true,
      unique: [true, 'This email is already used!'],
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      unique: [true, 'This phone number is already used!'],
    },
    password: {
      type: String,
      select: 0,
    },
    passwordChangedAt: {
      type: Date,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: defaultUserImage,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.CLIENT,
    },
    isSocialLogin: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
    isProfile: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    deactivationReason: {
      type: String,
    },
    deactivatedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

// Custom hooks/methods
authSchema.pre('save', async function (next) {
  // Only hash the password if payload has 'password' field (or is new)
  if (!this.isModified('password')) return next();

  // Hashing password before saving
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

authSchema.post('save', function (doc, next) {
  // Hiding the Hashed password from returned data
  doc.password = '';
  next();
});

// isUserExistsByEmail
authSchema.statics.isUserExistsByEmail = async function (
  email: string
): Promise<IAuth | null> {
  return await Auth.findOne({ email }).select('+password'); // will show the password
};

// isPasswordMatched
authSchema.methods.isPasswordMatched = async function (
  plainTextPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainTextPassword, this.password);
};

// isJWTIssuedBeforePasswordChanged
authSchema.methods.isJWTIssuedBeforePasswordChanged = function (
  jwtIssuedTimestamp: number
): boolean {
  const passwordChangedTime = new Date(this.passwordChangedAt).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

// For checking if password is correct
authSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const Auth = mongoose.model<IAuth, IAuthModel>('Auth', authSchema);

import bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';
import config from '../../config';
import { defaultUserImage, ROLE } from './auth.constant';
import { IAuth, IAuthModel } from './auth.interface';

const authSchema = new Schema<IAuth, IAuthModel>(
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
      unique: true,
      sparse: true,
      required: false,
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
    },
    otpExpiry: {
      type: Date,
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
    isProfile: {
      type: Boolean,
      default: false,
    },
    isVerifiedByOTP: {
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
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

authSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

authSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

authSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

authSchema.post('save', function (doc, next) {
  doc.password = '';
  next();
});

// isUserExistsByEmail
authSchema.statics.isUserExistsByEmail = async function (
  email: string
): Promise<IAuth | null> {
  return await Auth.findOne({ email }).select('+password');
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
// authSchema.methods.isPasswordCorrect = async function (password: string) {
//   return await bcrypt.compare(password, this.password);
// };

const Auth = model<IAuth, IAuthModel>('Auth', authSchema);

export default Auth;

import { Document, Model } from 'mongoose';
import { TRole } from './auth.constant';
import { Types } from 'mongoose';

// Instance methods
export interface IAuth extends Document {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  passwordChangedAt?: Date;
  fcmToken?: string | null;
  image: string;
  otp: string;
  otpExpiry: Date;
  role: TRole;
  isSocialLogin: boolean;
  refreshToken?: string | null;
  isProfile: boolean;
  isVerifiedByOTP: boolean;
  isDeactivated: boolean;
  deactivationReason: string;
  deactivatedAt: Date | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isPasswordMatched(plainTextPassword: string): Promise<boolean>;

  isJWTIssuedBeforePasswordChanged(
    jwtIssuedTimestamp: number | undefined
  ): boolean;

  // isPasswordCorrect(password: string): Promise<boolean>;
}

// Static methods
export interface IAuthModel extends Model<IAuth> {
  isUserExistsByEmail(email: string): Promise<IAuth | null>;
}

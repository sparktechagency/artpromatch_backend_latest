import { Document, Model, ObjectId } from 'mongoose';
import { TRole } from './auth.constant';

export interface IAuth extends Document {
  _id: ObjectId;
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
  isVerified: boolean;
  stripeAccountId: string;
  isDeactivated: boolean;
  deactivationReason: string;
  deactivatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthMethods extends Model<IAuth> {
  isUserExistsByEmail(email: string): Promise<IAuth | null>;

  isPasswordMatched(plainTextPassword: string): Promise<boolean>;

  isJWTIssuedBeforePasswordChanged(jwtIssuedTimestamp: number): boolean;

  // isPasswordCorrect(password: string): Promise<boolean>;
  // generateAccessToken(): string;
  // generateRefreshToken(): string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAuthModel
  extends Model<IAuth, Record<string, never>, IAuthMethods> {}

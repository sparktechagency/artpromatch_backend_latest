/* eslint-disable no-unused-vars */
import { Document, Model, Types } from 'mongoose';
import { TRole } from './auth.constant';

export interface IAuth extends Document {
  email: string;
  fullName?: string;
  phoneNumber: string;
  password: string;
  fcmToken?: string | null;
  image?: string;
  role: TRole;
  isSocialLogin: boolean;
  refreshToken?: string | null;
  isProfile: boolean;
  isVerified: boolean;
  isDeactivated: boolean;
  deactivationReason: String;
  deactivatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAuthModel
  extends Model<IAuth, Record<string, never>, IAuthMethods> {}

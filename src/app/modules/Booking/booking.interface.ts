import { IArtist } from '../Artist/artist.interface';
import { Document, Types } from 'mongoose';
import {
  TBookingStatus,
  TPaymentStatus,
  TSessionStatus,
} from './booking.constant';

export interface IBookingSession {
  _id?: string;
  sessionNumber: number;
  startTime: string;
  endTime: string;
  startTimeInMin?: number;
  endTimeInMin?: number;
  date: Date;
  status: TSessionStatus;
}

export interface IPaymentClient {
  chargeId?: string;
  paymentIntentId?: string;
  refundId?: string;
}

export interface IPaymentArtist {
  transferId?: string;
  transactionId?: string;
  payoutId?: string;
}

export interface IPayment {
  client: IPaymentClient;
  artist: IPaymentArtist;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  artist: Types.ObjectId | IArtist;
  client: Types.ObjectId;
  service: Types.ObjectId;

  preferredDate?: {
    startDate: string;
    endDate: string;
  };

  demoImage: string;
  clientInfo: {
    fullName: string;
    email: string;
    phone?: string;
  };
  artistInfo: {
    fullName: string;
    email: string;
    phone?: string;
  };
  sessions: IBookingSession[];
  scheduledDurationInMin: number;
  // Booking-level status
  status: TBookingStatus;

  serviceName: string;
  price: number;
  bodyPart: string;

  // Payment (global, not per session)
  payment: IPayment;
  checkoutSessionId?: string;

  artistEarning: number;
  paymentStatus: TPaymentStatus;
  otp?: string;
  otpExpiresAt?: Date;
  stripeFee: number;
  platFormFee: number;
  // If booking cancelled (by artist usually)
  cancelledAt?: Date | null;
  cancelBy?: 'ARTIST' | 'CLIENT';
  // Review and rating
  review?: string;
  rating?: number;

  isInGuestSpot: boolean;
  isReviewed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  isOtpMatched(otp: string): Promise<boolean>;
}

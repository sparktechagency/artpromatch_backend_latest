import { Document, Types } from 'mongoose';
import { TWeekDay } from '../Artist/artist.constant';
import { TBookingStatus, TPaymentStatus } from './booking.constant';

export interface IBooking extends Document {
  artist: Types.ObjectId;
  client: Types.ObjectId;
  originalDate: Date | null;
  day: TWeekDay;
  startMin: number;
  endMin: number;
  bookingStatus: TBookingStatus;
  bookingPrice: number;
  serviceName: string;
  bodyLocation: string;
  referralImage?: string;
  paymentIntentId?: string;
  chargeId?: string;
  paymentStatus: TPaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

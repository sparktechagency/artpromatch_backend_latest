import { Document, Types } from 'mongoose';
// import { TWeekDay } from '../Artist/artist.constant';
import { TBookingStatus, TPaymentStatus } from './booking.constant';

export interface IBooking extends Document {
  artist: Types.ObjectId;
  client: Types.ObjectId;
  service: Types.ObjectId;

  originalDate: Date | null;
  // day: TWeekDay;
  startTimeinMinute: number;
  endTimeinMinute: number;
  status: TBookingStatus;

  serviceName: string;
  price: number;
  serviceLocation: string;
  bodyPart: string;

  paymentIntentId: string;
  chargeId: string;
  paymentStatus: TPaymentStatus;

  review?: string;
  rating?: number;

  isInGuestSpot: boolean;

  createdAt: Date;
  updatedAt: Date;
}

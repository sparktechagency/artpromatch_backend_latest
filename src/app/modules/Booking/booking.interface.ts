import { Document, Types } from 'mongoose';
// import { TWeekDay } from '../Artist/artist.constant';
import { TBookingStatus, TPaymentStatus,  } from './booking.constant';

export interface IBookingSession {
  sessionNumber: number;
  startMin: number; // minutes from midnight
  endMin: number;
  date: Date;
  status: "scheduled" | "completed" | "cancelled";
}

export interface IBooking extends Document{
  _id: Types.ObjectId
  artist: Types.ObjectId;
  client: Types.ObjectId;
  service: Types.ObjectId;
  
  preferredDate?: {
    startDate: Date;
    endDate: Date;
  };
  
  demoImage: string;
  sessions: IBookingSession[];

  // Booking-level status
  status: TBookingStatus;

  serviceName: string;
  price: number;
  bodyPart: string;

  // Payment (global, not per session)
  paymentIntentId?: string;
  paymentStatus: TPaymentStatus;

  // If booking cancelled (by artist usually)
  cancelledAt?: Date | null;

  // Review and rating
  review?: string;
  rating?: number;

  isInGuestSpot: boolean;

}
import { Document, Types } from 'mongoose';
// import { TWeekDay } from '../Artist/artist.constant';
import { TBookingStatus, TPaymentStatus, TSessionStatus,  } from './booking.constant';
import { IArtist } from '../Artist/artist.interface';

export interface IBookingSession {
  _id?:string;
  sessionNumber: number;
  startTime: string; 
  endTime: string; 
  startTimeInMin?: number; 
  endTimeInMin?: number;
  date: Date;
  status: TSessionStatus;
}

export interface IBooking extends Document{
  _id: Types.ObjectId
  artist: Types.ObjectId | IArtist;
  client: Types.ObjectId;
  service: Types.ObjectId;
  
  preferredDate?: {
    startDate: Date;
    endDate: Date;
  };
  
  demoImage: string;
  clientInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  artistInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  sessions: IBookingSession[];
  scheduledDurationInMin: number
  // Booking-level status
  status: TBookingStatus;

  serviceName: string;
  price: number;
  bodyPart: string;
  
  artistEarning: number;
  // Payment (global, not per session)
  paymentIntentId?: string;
  chargeId?: string;
  transferId?: string;
  transactionId?: string;
  payoutId?: string;
  paymentStatus: TPaymentStatus;
  
  stripeFee: number;
  platFromFee: number;
  // If booking cancelled (by artist usually)
  cancelledAt?: Date | null;
  cancelBy?: 'ARTIST' | 'CLIENT'
  // Review and rating
  review?: string;
  rating?: number;

  isInGuestSpot: boolean;
  createdAt: Date,
  updatedAt: Date;
}
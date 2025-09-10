import { Document, Types } from 'mongoose';
import {
  ExpertiseType,
  TArtistType,
  TContact,
  TServices,
} from './artist.constant';

interface IBoost {
  lastBoostAt: Date | null;
  endTime: Date | null;
  isActive: boolean;
}
export interface IArtist extends Document {
  auth: Types.ObjectId;
  business: Types.ObjectId | null;
  isConnBusiness: boolean;
  type: TArtistType;
  expertise: ExpertiseType[];
  city: string;
  // image?: string;
  stripeAccountId: string;
  isStripeReady: boolean;
  mainLocation: { type: 'Point'; coordinates: [number, number] };
  currentLocation: {
    type: 'Point';
    coordinates: [number, number];
    currentLocationUntil: Date | null;
  };
  hourlyRate: number;
  idCardFront: string;
  idCardBack: string;
  selfieWithId: string;

  boost: IBoost;
  services?: TServices;
  contact?: TContact;
  description: string;
  preferences?: Types.ObjectId;

  totalCompletedService: number;
  totalReviewCount: number;
  avgRating: number;
}

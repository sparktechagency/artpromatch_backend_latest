import { Document, Types } from 'mongoose';
import { ExpertiseType, TBoost, TArtistType } from './artist.constant';

export interface IArtist extends Document {
  _id: Types.ObjectId;
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
  stringLocation: string;
  currentLocation: {
    type: 'Point';
    coordinates: [number, number];
    currentLocationUntil: Date | null;
  };

  hourlyRate: number;
  idCardFront: string;
  idCardBack: string;
  selfieWithId: string;

  boost: TBoost;
  // services?: TService[];
  // contact?: TContact;
  description: string;
  preferences?: Types.ObjectId;

  totalCompletedService: number;
  totalReviewCount: number;
  avgRating: number;
}

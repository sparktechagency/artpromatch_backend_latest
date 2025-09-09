import { Document, Types } from 'mongoose';
import {
  ExpertiseType,
  TArtistType,
  TContact,
  TServices,
} from './artist.constant';

interface IBoost {
      lastBoostAt: Date | null;
      endTime: Date | null
      isActive: boolean
}
export interface IArtist extends Document {
  auth: Types.ObjectId;
  business: Types.ObjectId | null;
  type: TArtistType;
  expertise: ExpertiseType[];
  image?: string;
  mainLocation: { type: 'Point'; coordinates: [number, number] };
  currentLocation: { type: 'Point'; coordinates: [number, number]; currentLocationUntil: Date | null};
  city: string;
  hourlyRate: number;
  isConnBusiness: boolean;
  idCardFront: string;
  idCardBack: string;
  boost: IBoost;
  avgRating:number;
  totalReview:number;
  selfieWithId: string;
  taskCompleted: number;
  services?: TServices;
  contact?: TContact;
  description: string;
  preferences?: Types.ObjectId;
}

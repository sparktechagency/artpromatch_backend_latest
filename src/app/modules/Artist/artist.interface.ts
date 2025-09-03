import { Document, Types } from 'mongoose';
import {
  ExpertiseType,
  TArtistType,
  TContact,
  TServices,
} from './artist.constant';

export interface IArtist extends Document {
  auth: Types.ObjectId;
  business: Types.ObjectId | null;
  type: TArtistType;
  expertise: ExpertiseType[];
  image?: string;
  mainLocation: { type: 'Point'; coordinates: [number, number] };
  currentLocation: { type: 'Point'; coordinates: [number, number] };
  city: string;
  isConnBusiness: boolean;
  idCardFront: string;
  idCardBack: string;
  rating:number;
  selfieWithId: string;
  taskCompleted: number;
  services?: TServices;
  contact?: TContact;
  description: string;
  flashes: Types.ObjectId[];
  portfolio: Types.ObjectId[];
  preferences?: Types.ObjectId;
  timeOff: Date[];
}

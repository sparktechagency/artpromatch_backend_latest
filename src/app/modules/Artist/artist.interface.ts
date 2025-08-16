import { Document, Types } from 'mongoose';
import {
  ExpertiseType,
  TArtistType,
  TContact,
  TServices,
} from './artist.constant';

export interface IArtist extends Document {
  auth: Types.ObjectId;
  type: TArtistType;
  expertise: ExpertiseType[];
  image?: string;
  location: { type: 'Point'; coordinates: [number, number] };
  city: string;
  idCardFront: string;
  idCardBack: string;
  selfieWithId: string;
  profileViews: number;
  services?: TServices;
  contact?: TContact;
  description: string;
  flashes: Types.ObjectId[];
  portfolio: Types.ObjectId[];
  preferences?: Types.ObjectId;
  timeOff: Date[];
}

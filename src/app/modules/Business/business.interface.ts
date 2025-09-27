import { Document, Types } from 'mongoose';
import { TBusinessType, TServiceOffered } from './business.constants';

export interface IBusiness extends Document {
  _id: Types.ObjectId;
  auth: Types.ObjectId;

  // Core details
  studioName: string;
  businessType: TBusinessType;
  servicesOffered: TServiceOffered[];
  // Contact & location
  location: { type: 'Point'; coordinates: [number, number] };
  stringLocation: string;
  city: string;
  // contact: TContact;

  // // Operating hours
  // operatingHours: {
  //   [key in TOperatingDay]?: { start: string; end: string }[];
  // };

  // Documents for verification
  registrationCertificate: string;
  taxIdOrEquivalent: string;
  studioLicense?: string;

  // Metadata
  taskCompleted: number;
  description?: string;

  // References
  preferences?: Types.ObjectId;
  // guestSpots?: Types.ObjectId[];
  // events?: Types.ObjectId[];
  // residentArtists?: Types.ObjectId[];

  timeOff: Date[];
}

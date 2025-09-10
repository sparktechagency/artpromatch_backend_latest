import { Document, Types } from 'mongoose';

export interface IArtistBoost extends Document {
  artist: Types.ObjectId;

  startTime: Date;
  endTime: Date;

  price: number;
  paymentIntentId: string;
  chargeId: string;

  paymentStatus: 'Pending' | 'Succeeded' | 'Failed' | 'Refunded';
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

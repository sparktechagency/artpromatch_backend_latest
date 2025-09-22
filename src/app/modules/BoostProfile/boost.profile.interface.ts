import { Document, Types } from 'mongoose';

export interface IArtistBoost extends Document {
  _id: Types.ObjectId;
  artist: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  paymentIntentId: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

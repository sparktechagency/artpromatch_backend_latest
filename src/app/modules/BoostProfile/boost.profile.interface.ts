import { Document, Types } from 'mongoose';

export interface IArtistBoost extends Document {
  _id: Types.ObjectId;
  artist: Types.ObjectId;

  startTime: Date;
  endTime: Date;

  paymentStatus: 'pending' | 'succeeded' | 'failed';

  paymentIntentId: string;
  charge: number;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

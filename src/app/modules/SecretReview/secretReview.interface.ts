import { Document, Types } from 'mongoose';

export interface ISecretReview extends Document {
  // client: Types.ObjectId;
  // artist: Types.ObjectId;
  service: Types.ObjectId;
  booking: Types.ObjectId;
  description: string;
}

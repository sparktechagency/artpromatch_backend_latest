import { Document, Types } from 'mongoose';
import { RequestStatus } from './request.constant';

export interface IRequest extends Document {
  senderType: string;
  artistId: Types.ObjectId;
  businessId: Types.ObjectId;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

import { Document, ObjectId } from 'mongoose';
import { RequestStatus } from './request.constant';

export interface IRequest extends Document {
  _id: ObjectId;

  artistId: ObjectId;
  businessId: ObjectId;
  status: RequestStatus;

  createdAt: Date;
  updatedAt: Date;
}

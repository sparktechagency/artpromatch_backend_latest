import mongoose from 'mongoose';
import { REQUEST_STATUS } from './request.constant';
import { IRequest } from './request.interface';

// Define the request schema
const requestSchema = new mongoose.Schema<IRequest>(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
    },
  },
  { timestamps: true,versionKey:false }
);

const RequestModel = mongoose.model<IRequest>('Request', requestSchema);

export default RequestModel;

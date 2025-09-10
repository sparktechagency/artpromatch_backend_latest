import { Document, Types } from 'mongoose';

export interface TServicePayload {
  title: string;
  description: string;
  price: number;
  durationInMinutes: number;
  bufferTimeInMinutes: number;
}

export type TServiceImages = {
  images: Express.Multer.File[];
  thumbnail: Express.Multer.File[];
};

export interface IService extends Document {
  artist: Types.ObjectId;

  title: string;
  description: string;
  price: number;

  thumbnail: string;
  images: string[];

  durationInMinutes: number;
  bufferTimeInMinutes: number;

  totalCompletedOrder: number;
  totalReviewCount: number;
  avgRating: number;
  
  isDeleted: boolean;
}

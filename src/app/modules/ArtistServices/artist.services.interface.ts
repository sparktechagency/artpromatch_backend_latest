import { Document, Types } from 'mongoose';

export interface TServicePayload {
  name: string;
  duration: string;
  bufferTime: string;
}

export type TServiceImage = {
  serviceImage?: Express.Multer.File[];
};

export interface IService extends Document {
  artist: Types.ObjectId;
  name: string;
  image: string;
  duration: number;
  bufferTime: number;
}

import { Document, Schema } from 'mongoose';

export interface IShowcase extends Document {
  artist: Schema.Types.ObjectId;
  folder: Schema.Types.ObjectId;
  url: string;
}

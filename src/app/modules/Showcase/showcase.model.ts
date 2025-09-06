import mongoose from 'mongoose';
import { IShowcase } from './showcase.interface';

const showcaseSchema = new mongoose.Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      required: true,
      index: true,
    },
    url: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Image = mongoose.model<IShowcase>('Image', showcaseSchema);
export default Image;

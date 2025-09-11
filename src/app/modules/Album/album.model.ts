import { model, Schema } from 'mongoose';
import { IShowcase } from './album.interface';

const showcaseSchema = new Schema<IShowcase>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    folder: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const Image = model<IShowcase>('Image', showcaseSchema);
export default Image;

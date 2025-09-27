import { model, Schema } from 'mongoose';
import { IFolder } from './folder.interface';
import { FOLDER_FOR } from './folder.constant';

const folderSchema = new Schema<IFolder>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    for: {
      type: String,
      enum: Object.values(FOLDER_FOR),
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const Folder = model('Folder', folderSchema);

export default Folder;

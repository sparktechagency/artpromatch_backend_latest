import mongoose from 'mongoose';
import { IFolder } from './folder.interface';
import { FOLDER_FOR } from './folder.constant';

const folderSchema = new mongoose.Schema<IFolder>(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
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
  },
  { timestamps: true, versionKey: false }
);

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;

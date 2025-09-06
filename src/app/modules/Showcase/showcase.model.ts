import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
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
  { timestamps: true, versionKey: false }
);

const Image = mongoose.model('Image', imageSchema);
export default Image;

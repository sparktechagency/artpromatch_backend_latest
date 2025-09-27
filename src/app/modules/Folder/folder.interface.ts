import { Document, Types } from 'mongoose';
import { TFolderFor } from './folder.constant';

export interface IFolder extends Document {
  owner: Types.ObjectId;
  name: string;
  for: TFolderFor;
  images: string[];
  isPublished: boolean;
}

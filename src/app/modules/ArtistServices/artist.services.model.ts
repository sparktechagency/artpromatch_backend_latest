import { Schema, model } from 'mongoose';
import { IService } from './artist.services.interface';


const serviceSchema = new Schema<IService>({
  artist: { type: Schema.Types.ObjectId, ref: 'Artist', required: true, index: true },
  name: { type: String, required: true },
  image: { type: String, required: false },
  duration: { type: Number, required: true }, 
  bufferTime: { type: Number, default: 0 }, 
}, {
  timestamps: true,
  versionKey: false
});

const Service = model<IService>('ArtistService', serviceSchema);
export default Service
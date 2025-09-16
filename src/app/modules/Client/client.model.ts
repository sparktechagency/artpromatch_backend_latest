import { Schema, model } from 'mongoose';
import {
  artistTypes,
  dateFormats,
  favoritePiercings,
  favoriteTattoos,
  homeViews,
  serviceTypes,
} from './client.constant';
import { IClient } from './client.interface';
// import { locationSchema } from '../Location/location.model';

const clientSchema = new Schema<IClient>(
  {
    auth: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
      unique: true,
    },

    location: {
      type: {
        type: String,
        default: 'Point',
        // enum: ['Point'],
        // required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    
    stringLocation: {
      type: String,
      required: true,
    },

    radius: {
      type: Number,
    },

    lookingFor: {
      type: [String],
      enum: Object.values(serviceTypes),
      default: [],
    },

    country: {
      type: String,
    },

    favoriteTattoos: {
      type: [String],
      enum: Object.values(favoriteTattoos),
      default: [],
    },

    favoritePiercing: {
      type: [String],
      enum: Object.values(favoritePiercings),
      default: [],
    },

    homeView: {
      type: String,
      enum: Object.values(homeViews),
      default: homeViews.BOTH,
    },

    preferredArtistType: {
      type: String,
      enum: Object.values(artistTypes),
      default: artistTypes.BOTH,
    },

    language: {
      type: String,
    },

    dateFormat: {
      type: String,
      enum: Object.values(dateFormats),
    },
  },
  { timestamps: true, versionKey: false }
);

clientSchema.index({ location: '2dsphere' });

const Client = model<IClient>('Client', clientSchema);

export default Client;

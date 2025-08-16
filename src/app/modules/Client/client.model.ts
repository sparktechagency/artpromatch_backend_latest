import mongoose, { Schema, model } from 'mongoose';
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
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    radius: {
      type: Number,
      required: false,
    },

    lookingFor: {
      type: [String],
      enum: Object.values(serviceTypes),
      required: false,
      default: [],
    },

    country: {
      type: String,
      required: false,
    },

    favoriteTattoos: {
      type: [String],
      enum: Object.values(favoriteTattoos),
      required: false,
      default: [],
    },

    favoritePiercing: {
      type: [String],
      enum: Object.values(favoritePiercings),
      required: false,
      default: [],
    },

    homeView: {
      type: String,
      enum: Object.values(homeViews),
      required: false,
      default: homeViews.BOTH,
    },

    preferredArtistType: {
      type: String,
      enum: Object.values(artistTypes),
      required: false,
      default: artistTypes.BOTH,
    },

    language: {
      type: String,
      required: false,
    },

    dateFormat: {
      type: String,
      enum: Object.values(dateFormats),
      required: false,
    },
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

clientSchema.index({ location: '2dsphere' });

const Client = model<IClient>('Client', clientSchema);

export default Client;

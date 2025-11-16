import { model, Schema } from 'mongoose';
import { IArtistBoost } from './boost.profile.interface';

const ArtistBoostSchema = new Schema<IArtistBoost>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },

    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: Date.now() + 12 * 60 * 60 * 1000,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending',
    },

    paymentIntentId: {
      type: String,
    },
    charge: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export const ArtistBoost = model<IArtistBoost>(
  'ArtistBoost',
  ArtistBoostSchema
);

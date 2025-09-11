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

    price: {
      type: Number,
      required: true,
    },
    paymentIntentId: {
      type: String,
    },
    chargeId: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ['Pending', 'Succeeded', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const ArtistBoost = model<IArtistBoost>(
  'ArtistBoost',
  ArtistBoostSchema
);

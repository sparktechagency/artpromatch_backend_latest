import { Schema, model } from 'mongoose';
import { OffTimeSchema } from '../Schedule/schedule.model';
import { IGuestSpot } from './guest.spot.interface';

const GuestSpotSchema = new Schema<IGuestSpot>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String, // 9: 00 am 10: 00 pm
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },

    startMin: {
      type: Number, // 540 1320
      required: true,
    },
    endMin: {
      type: Number,
      required: true,
    },

    offTimes: [OffTimeSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const GuestSpot = model<IGuestSpot>('GuestSpot', GuestSpotSchema);

export default GuestSpot;

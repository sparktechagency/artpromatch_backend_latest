// src/models/guestSpot.model.ts
import { Schema, model } from 'mongoose';
import { OffTimeSchema } from '../Schedule/schedule.model';
import { IGuestSpot } from './guest.spot.interface';

const GuestSpotSchema = new Schema<IGuestSpot>(
  {
    artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    startTime: { type: String, required: true }, // 9: 00 am 10: 00 pm
    endTime: { type: String, required: true },

    startMin: { type: Number, required: true }, // 540 1320
    endMin: { type: Number, required: true },
    offTimes: [OffTimeSchema],
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const GuestSpot = model<IGuestSpot>('GuestSpot', GuestSpotSchema);

export default GuestSpot;

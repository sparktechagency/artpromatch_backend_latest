import mongoose, { Schema } from "mongoose";
import { IArtistBoost } from "./boost.profile.interface";


const ArtistBoostSchema = new Schema<IArtistBoost>(
  {
    artistId: {
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
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 12,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);


ArtistBoostSchema.pre("validate", function (next) {
  if (this.isNew) {
    if (!this.endTime) {
      this.endTime = new Date(
        this.startTime.getTime() + this.duration * 60 * 60 * 1000
      );
    }
  }

  if (this.endTime < new Date()) {
    this.isActive = false;
  }

  next();
});

export const ArtistBoost = mongoose.model<IArtistBoost>(
  "ArtistBoost",
  ArtistBoostSchema
);
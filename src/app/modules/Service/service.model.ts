import { Schema, model } from 'mongoose';
import { IService, TattooBodyParts } from './service.interface';

const serviceSchema = new Schema<IService>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (val: string[]) {
          return val.length >= 2 && val.length <= 5;
        },
        message: 'Images array must contain between 2 and 5 items!',
      },
      required: [true, 'Images array must contain between 2 and 5 items!'],
    },

    sessionType: {
      type: String,
      enum: ['short', 'long'],
      required: true,
    },
    pricingType: { type: String, enum: ['hourly', 'fixed'], default: 'fixed' },
    hourlyRate: { type: Number},
    fixedPrice: { type: Number},
    totalDuration: {
      type: String,
      required: true,
    },

    sessionDuration: { type: String, required: true },

    totalDurationInMin: {
      type: Number,
      required: true
    },

    sessionDurationInMin: { type: Number, required: true },
    numberOfSessions: { type: Number, required: true },

    bufferTimeInMinutes: {
      type: Number,
      default: 0,
    },
    bodyLocation: {
      type: String,
      enum: Object.values(TattooBodyParts),
      required: true,
    },
    totalCompletedOrder: {
      type: Number,
      default: 0,
    },
    totalReviewCount: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

serviceSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

serviceSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

serviceSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

const Service = model<IService>('Service', serviceSchema);
export default Service;

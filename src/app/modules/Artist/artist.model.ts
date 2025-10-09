import { model, Schema } from 'mongoose';
import { ARTIST_TYPE, expertiseTypes, TBoost } from './artist.constant';
import { IArtist } from './artist.interface';

// // Subschema: Contact
// const contactSchema = new Schema<TContact>(
//   {
//     email: { type: String },
//     phone: { type: String },
//     address: { type: String },
//   },
//   { _id: false }
// );

// // Subschema: Services
// const servicesSchema = new Schema<TService>(
//   {
//     name: { type: String, required: true },
//     duration: { type: String, required: true },
//     bufferTime: { type: String, default: '' },
//   },
//   { _id: false }
// );

const boostSchema = new Schema<TBoost>(
  {
    lastBoostAt: { type: Date, default: null },
    endTime: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
  },
  { _id: false }
);

// Main Artist Schema
const artistSchema = new Schema<IArtist>(
  {
    auth: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },

    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    isConnBusiness: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      enum: Object.values(ARTIST_TYPE),
      required: true,
    },

    expertise: {
      type: [String],
      enum: Object.values(expertiseTypes),
      required: true,
    },

    // city: {
    //   type: String,
    //   required: true,
    // },

    stripeAccountId: {
      type: String,
      default: null,
    },

    isStripeReady: {
      type: Boolean,
      default: false,
    },

    mainLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
    },
    stringLocation: {
      type: String,
      default: 'USA',
    },

    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
      currentLocationUntil: { type: Date, default: null },
    },

    hourlyRate: {
      type: Number,
      required: true,
    },

    idCardFront: {
      type: String,
      default: null,
    },
    idCardBack: {
      type: String,
      default: null,
    },
    selfieWithId: {
      type: String,
      default: null,
    },

    boost: {
      type: boostSchema,
      default: () => ({ lastBoostAt: null, endTime: null, isActive: false }),
    },

    // services: {
    //   type: [serviceSchema],
    //   required: true,
    // },
    // contact: {
    //   type: contactSchema,
    // },

    description: {
      type: String,
      required: true,
    },

    preferences: {
      type: Schema.Types.ObjectId,
      ref: 'ArtistPreferences',
    },

    totalCompletedService: {
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
  },
  { timestamps: true, versionKey: false }
);

artistSchema.index({ currentLocation: '2dsphere' });

const Artist = model<IArtist>('Artist', artistSchema);

export default Artist;

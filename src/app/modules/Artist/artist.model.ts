import { Schema, model } from 'mongoose';
import { ARTIST_TYPE, expertiseTypes } from './artist.constant';
import { IArtist } from './artist.interface';

// 🔹 Subschema: Contact
const contactSchema = new Schema(
  {
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { _id: false }
);

// 🔹 Subschema: Services
const servicesSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  bufferTime: { type: String, default: '' },
});

// 🔹 Subschema: Portfolio
const portfolioSchema = new Schema({
  folder: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    required: true,
  },
  position: { type: Number, default: 0 },
});

// 🔹 Main Artist Schema
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

    mainLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        // enum: ['Point'],
        // required: true,
      },
      coordinates: { type: [Number], required: true },
    },

    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        // enum: ['Point'],
        // required: true,
      },
      coordinates: { type: [Number], required: true },
      currentLocationUntil: { type: Date, default: null },
    },

    city: {
      type: String,
      required: true,
    },

    idCardFront: {
      type: String,
      required: true,
    },

    idCardBack: {
      type: String,
      required: true,
    },

    selfieWithId: {
      type: String,
      required: true,
    },

    taskCompleted: {
      type: Number,
      default: 0,
    },

    avgRating: {
      type: Number,
      default: 0,
    },

    totalReview: {
      type: Number,
      default: 0,
    },
    boost: {
      lastBoostAt: { type: Date, default: null }, 
      endTime: { type: Date, default: null }, 
      isActive: { type: Boolean, default: false }, 
    },
    services: {
      type: [servicesSchema],
      required: true,
    },

    contact: {
      type: contactSchema,
    },

    description: {
      type: String,
    },
    preferences: {
      type: Schema.Types.ObjectId,
      ref: 'ArtistPreferences',
    },
    timeOff: [{ type: Date }],
  },
  { timestamps: true, versionKey: false }
);

artistSchema.index({ location: '2dsphere' });

const Artist = model<IArtist>('Artist', artistSchema);

export default Artist;

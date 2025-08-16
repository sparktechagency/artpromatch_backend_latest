import mongoose, { Schema, model } from 'mongoose';
import { IArtist } from './artist.interface';
import { expertiseTypes, ARTIST_TYPE } from './artist.constant';

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
const servicesSchema = new Schema(
  {
    hourlyRate: { type: Number, default: 0 },
    dayRate: { type: Number, default: 0 },
    consultationsFee: { type: Number, default: 0 },
  },
  { _id: false }
);

// 🔹 Subschema: Portfolio
const portfolioSchema = new Schema(
  {
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      required: true,
    },
    position: { type: Number, default: 0 },
  },
  { _id: false }
);

// 🔹 Main Artist Schema
const artistSchema = new Schema<IArtist>(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
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

    profileViews: {
      type: Number,
      default: 0,
    },

    services: {
      type: servicesSchema,
      required: false,
    },

    contact: {
      type: contactSchema,
      required: false,
    },

    description: {
      type: String,
      required: false,
    },
    flashes: [
      {
        type: portfolioSchema,
        required: true,
      },
    ],
    portfolio: [
      {
        type: portfolioSchema,
        required: true,
      },
    ],
    preferences: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArtistPreferences',
      required: false,
    },
    timeOff: [{ type: Date }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

artistSchema.index({ location: '2dsphere' });

const Artist = model<IArtist>('Artist', artistSchema);

export default Artist;

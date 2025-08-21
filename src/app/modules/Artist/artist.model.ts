import mongoose, { Schema, model } from 'mongoose';
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
const servicesSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
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

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
      default: null
    },
    
    isConnBusiness:{
      type: Boolean,
      default: false
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

    taskCompleted: {
      type: Number,
      default: 0,
    },
    
    rating: {
      type: Number,
      default: 0,
    },

    services: {
      type: [servicesSchema],
      required: true,
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

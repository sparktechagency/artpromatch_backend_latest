import { model, Schema } from 'mongoose';
import { BUSINESS_TYPE, SERVICES_OFFERED } from './business.constants';
import { IBusiness } from './business.interface';
// import { TContact } from '../Artist/artist.constant';

// const timeRangeSchema = new Schema<{ start: string; end: string }>(
//   {
//     start: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
//     end: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
//   },
//   { _id: false }
// );

// const contactSchema = new Schema<TContact>(
//   {
//     email: { type: String, required: true },
//     phone: { type: String, required: true },
//     address: { type: String, required: true },
//   },
//   { _id: false }
// );

const businessSchema = new Schema<IBusiness>(
  {
    auth: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
      unique: true,
    },

    // Core details
    studioName: { type: String, required: true },
    businessType: {
      type: String,
      enum: Object.values(BUSINESS_TYPE),
      required: true,
    },
    servicesOffered: {
      type: [String],
      enum: Object.values(SERVICES_OFFERED),
      default: [],
    },

    // Contact & location
    city: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    // contact: { type: contactSchema, required: true },

    // // Operating hours
    // operatingHours: {
    //   type: Map,
    //   of: [timeRangeSchema],
    //   default: {},
    // },

    // Documents for verification
    registrationCertificate: { type: String, required: true },
    taxIdOrEquivalent: { type: String, required: true },
    studioLicense: { type: String },

    // Metadata
    description: { type: String },
    taskCompleted: { type: Number, default: 0 },

    // References
    preferences: { type: Schema.Types.ObjectId, ref: 'BusinessPreferences' },
    // guestSpots: [{ type: Schema.Types.ObjectId, ref: 'GuestSpot' }],
    // events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    // residentArtists: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
    timeOff: [{ type: Date }],
  },
  { timestamps: true, versionKey: false }
);

businessSchema.index({ location: '2dsphere' });

const Business = model<IBusiness>('Business', businessSchema);

export default Business;

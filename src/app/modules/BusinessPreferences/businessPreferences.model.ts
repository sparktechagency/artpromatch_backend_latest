import { connectedAccountSchema } from '../ClientPreferences/clientPreferences.model';
import { IBusinessPreferences } from './businessPreferences.interface';
import { model, Schema } from 'mongoose';
// import {
//   CANCELLATION_POLICY,
//   PREFERRED_ARTIST_TYPE,
//   PREFERRED_EXPERIENCE,
// } from './businessPreference.constants';

const businessPreferencesSchema = new Schema<IBusinessPreferences>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      unique: true,
    },

    // Booking & Guest Spot Preferences
    // autoApproveGuestSpots: { type: Boolean, default: false },
    // cancellationPolicy: {
    //   type: String,
    //   enum: Object.values(CANCELLATION_POLICY),
    //   default: CANCELLATION_POLICY.HOURS_24,
    // },
    // preferredArtistType: {
    //   type: String,
    //   enum: Object.values(PREFERRED_ARTIST_TYPE),
    //   default: PREFERRED_ARTIST_TYPE.TATTOO,
    // },
    // preferredExperience: {
    //   type: String,
    //   enum: Object.values(PREFERRED_EXPERIENCE),
    //   default: PREFERRED_EXPERIENCE.ONE_TO_THREE,
    // },

    // Notification Settings
    // guestSpotRequests: { type: Boolean, default: true },
    // guestSpotConfirmations: { type: Boolean, default: true },
    // guestSpotCancellations: { type: Boolean, default: true },
    // newEventRegistrations: { type: Boolean, default: true },
    // newMessageAlerts: { type: Boolean, default: true },
    // paymentReceivedAlerts: { type: Boolean, default: true },
    // newAvailability: { type: Boolean, default: true },
    // lastMinuteBookings: { type: Boolean, default: true },
    // newGuestArtists: { type: Boolean, default: true },

    // Notification Channels
    notificationChannels: {
      type: [String],
      enum: ['app', 'email', 'sms'],
      default: ['app'],
    },

    // Security & Privacy
    // twoFactorAuthEnabled: { type: Boolean, default: false },
    // hideEarnings: { type: Boolean, default: false },
    // manualDepositApproval: { type: Boolean, default: false },

    // Locale
    // language: { type: String, default: 'en-UK' },
    // dateFormat: { type: String, default: 'DD/MM/YYYY' },

    // Connected Accounts
    connectedAccounts: [connectedAccountSchema],
  },
  { timestamps: true, versionKey: false }
);

const BusinessPreferences = model(
  'BusinessPreferences',
  businessPreferencesSchema
);

export default BusinessPreferences;

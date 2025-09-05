import mongoose, { Schema } from 'mongoose';
import { connectedAccountSchema } from '../ClientPreferences/clientPreferences.model';
import { cancellationPolicy } from '../Artist/artist.constant';
import { dateFormats, notificationChannel } from '../Client/client.constant';

const artistPreferencesSchema = new Schema(
  {
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      unique: true,
    },

    // Profile Settings
    showAvailability: { type: Boolean, default: true },
    publiclyVisibleProfile: { type: Boolean, default: true },
    onlineStatusVisible: { type: Boolean, default: false },

    // Booking Settings
    cancellationPolicy: {
      type: String,
      enum: Object.values(cancellationPolicy),
      default: cancellationPolicy.ONE_DAY,
    },
    allowDirectMessages: { type: Boolean, default: true },

    // Notification Settings (all default: true now)
    bookingRequests: { type: Boolean, default: true },
    bookingConfirmations: { type: Boolean, default: true },
    bookingCancellations: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    newMessages: { type: Boolean, default: true },
    appUpdates: { type: Boolean, default: true },
    newAvailability: { type: Boolean, default: true },
    lastMinuteBookings: { type: Boolean, default: true },
    newGuestArtists: { type: Boolean, default: true },

    // Notification Channels
    notificationPreferences: {
      type: [String],
      enum: Object.values(notificationChannel),
      default: [notificationChannel.APP],
    },

    // Security
    twoFactorAuthEnabled: { type: Boolean, default: false },

    // Locale
    language: { type: String, default: 'en-UK' },
    dateFormat: { type: String, default: dateFormats.DDMMYYYY },

    // Connected Accounts
    connectedAccounts: [connectedAccountSchema],
  },
  { timestamps: true, versionKey: false }
);

const ArtistPreferences = mongoose.model(
  'ArtistPreferences',
  artistPreferencesSchema
);

export default ArtistPreferences;

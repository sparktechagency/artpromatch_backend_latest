import { Types, Document } from 'mongoose';
import { TNotificationChannel } from '../Client/client.constant';
import { ConnectedAccount } from '../ClientPreferences/clientPreferences.interface';
// import { TCancellationPolicy } from '../Artist/artist.constant';

export interface IArtistPreferences extends Document {
  artistId: Types.ObjectId;

  // Profile Settings
  // showAvailability: boolean;
  // publiclyVisibleProfile: boolean;
  // onlineStatusVisible: boolean;

  // Booking Settings
  // cancellationPolicy: TCancellationPolicy;
  // allowDirectMessages: boolean;

  // Notification Settings
  // bookingRequests: boolean;
  // bookingConfirmations: boolean;
  // bookingCancellations: boolean;
  // eventReminders: boolean;
  // newMessages: boolean;
  appUpdates: boolean;
  // newAvailability: boolean;
  // lastMinuteBookings: boolean;
  // newGuestArtists: boolean;

  // Notification Channel Preferences
  notificationChannels: TNotificationChannel[]; // ['app', 'email', 'sms']

  // Security
  // twoFactorAuthEnabled: boolean;

  // Locale Settings
  // language: string; // e.g., 'en-UK'
  // dateFormat: string; // e.g., 'DD/MM/YYYY'

  // Connected Accounts
  connectedAccounts: ConnectedAccount[];
}

import { Document, Types } from 'mongoose';
import { TNotificationChannel } from '../Client/client.constant';

export interface ConnectedAccount {
  provider: 'google' | 'apple' | 'facebook';
  connectedOn: Date;
}

export interface IClientPreferences extends Document {
  clientId: Types.ObjectId;

  // Notifications
  // bookingConfirmations: boolean;
  // bookingReminders: boolean;
  // bookingCancellations: boolean;
  // newMessageNotifications: boolean;
  appUpdates: boolean;
  // newAvailability: boolean;
  // lastMinuteBookings: boolean;
  // newGuestArtists: boolean;
  notificationChannels: TNotificationChannel[];

  // Connected Accounts
  connectedAccounts: ConnectedAccount[];

  // Security & Personalization
  // twoFactorAuthEnabled: boolean;
  // personalizedContent: boolean;
  // locationSuggestions: boolean;
}

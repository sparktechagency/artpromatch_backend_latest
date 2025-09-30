import { Document, Types } from 'mongoose';
import { TNotificationChannel } from '../Client/client.constant';
import { ConnectedAccount } from '../ClientPreferences/clientPreferences.interface';
// import {
//   TCancellationPolicy,
//   TPreferredArtistType,
//   TPreferredExperience,
// } from './businessPreference.constants';

export interface IBusinessPreferences extends Document {
  businessId: Types.ObjectId;

  // Preferences
  // autoApproveGuestSpots: boolean;
  // cancellationPolicy: TCancellationPolicy;
  // preferredArtistType: TPreferredArtistType;
  // preferredExperience: TPreferredExperience;
  // language: string;
  // dateFormat: string;

  // Notifications
  // notifications: {
  //   guestSpotRequests: boolean;
  //   guestSpotConfirmations: boolean;
  //   guestSpotCancellations: boolean;
  //   newEventRegistrations: boolean;
  //   newMessageAlerts: boolean;
  //   paymentReceivedAlerts: boolean;
  //   newAvailability: boolean;
  //   lastMinuteBookings: boolean;
  //   newGuestArtists: boolean;
  // };

  notificationChannels: TNotificationChannel[];

  // Privacy & Security
  // twoFactorAuth: boolean;
  // hideEarnings: boolean;
  // manualDepositApproval: boolean;

  // Linked Accounts
  connectedAccounts: ConnectedAccount[];
}

import { expertiseTypes } from '../Artist/artist.constant';

export const serviceTypes = {
  TATTOOS: 'Tattoos',
  PIERCINGS: 'Piercings',
  CUSTOM_DESIGNS: 'Custom Designs',
  COVER_UPS: 'Cover-ups',
  TOUCH_UPS: 'Touch-ups',
  GUEST_SPOTS: 'Guest Spots',
} as const;

export const favoriteTattoos = expertiseTypes;

export const favoritePiercings = {
  EAR_LOBE: 'Ear Lobe',
  LIP: 'Lip (Labret, Monroe)',
  TRIPLE_HELIX: 'Triple Helix',
  INDUSTRIAL: 'Industrial',
  SEPTUM: 'Septum',
  NOSE_NOSTRIL: 'Nose Nostril',
  TONGUE: 'Tongue',
  NASALLANG: 'Nasallang',
  BLACKWORK: 'Blackwork',
  TRAGUSS: 'Traguss',
  CONCH: 'Conch',
} as const;

export const homeViews = {
  GRID: 'Grid View',
  MAP: 'Map View',
  BOTH: 'Both',
} as const;

export const artistTypes = {
  TATTOO: 'Tattoo Artist',
  PIERCER: 'Piercer',
  BOTH: 'Both',
} as const;

export const dateFormats = {
  DDMMYYYY: 'DD/MM/YYYY',
  MMDDYYYY: 'MM/DD/YYYY',
  YYYYMMDD: 'YYYY-MM-DD',
} as const;

export const notificationChannel = {
  APP: 'app',
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export type HomeView = (typeof homeViews)[keyof typeof homeViews];
export type FavoriteTattoo =
  (typeof favoriteTattoos)[keyof typeof favoriteTattoos];
export type FavoritePiercing =
  (typeof favoritePiercings)[keyof typeof favoritePiercings];
export type ServiceType = (typeof serviceTypes)[keyof typeof serviceTypes];
export type DateFormat = (typeof dateFormats)[keyof typeof dateFormats];
export type ArtistType = (typeof artistTypes)[keyof typeof artistTypes];
export type TNotificationChannel =
  (typeof notificationChannel)[keyof typeof notificationChannel];

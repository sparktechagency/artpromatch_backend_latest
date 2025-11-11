import { Document } from 'mongoose';
import {
  ArtistType,
  DateFormat,
  TFavoritePiercing,
  TFavoriteTattoo,
  HomeView,
  TLookingFor,
} from './client.constant';
import { Types } from 'mongoose';

export interface IClient extends Document {
  _id: Types.ObjectId;
  image?: string;
  location: { type: 'Point'; coordinates: [number, number] };
  stringLocation: string;
  radius: number;
  lookingFor: TLookingFor[];
  country: string;
  favoriteTattoos: TFavoriteTattoo[];
  favoritePiercing: TFavoritePiercing[];
  homeView: HomeView;
  preferredArtistType: ArtistType;
  language: string;
  dateFormat: DateFormat;
  auth: Types.ObjectId;
}

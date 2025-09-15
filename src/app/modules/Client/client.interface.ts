import { Document } from 'mongoose';
// import { locationSchema } from '../Location/location.model';
import {
  ArtistType,
  DateFormat,
  FavoritePiercing,
  FavoriteTattoo,
  HomeView,
  ServiceType,
} from './client.constant';
import { Types } from 'mongoose';

export interface IClient extends Document {
  _id: Types.ObjectId
  image?: string;
  location: { type: 'Point'; coordinates: [number, number] };
  radius: number;
  lookingFor: ServiceType[];
  country: string;
  favoriteTattoos: FavoriteTattoo[];
  favoritePiercing: FavoritePiercing[];
  homeView: HomeView;
  preferredArtistType: ArtistType;
  language: string;
  dateFormat: DateFormat;
  auth: Types.ObjectId;
}

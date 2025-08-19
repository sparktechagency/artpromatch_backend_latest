// import { Types, Document } from 'mongoose';
// import { TWeekDay } from '../Artist/artist.constant';

// export interface IAvailabilitySlot extends Document {
//   start: string; // Format: 'HH:MM'
//   end: string; // Format: 'HH:MM'
// }

// export interface ISlot extends Document {
//   auth: Types.ObjectId;
//   artist: Types.ObjectId;
//   day: TWeekDay;
//   slots: IAvailabilitySlot[];
//   createdAt?: Date;
//   updatedAt?: Date;
// }

import { Document, Types } from 'mongoose';

export interface ISlot {
  _id: Types.ObjectId;
  startTime: string;
  endTime: string;
  startDateTime: Date;
  endDateTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IArtistSchedule extends Document {
  artistId: Types.ObjectId;
  mon: ISlot[];
  tue: ISlot[];
  wed: ISlot[];
  thu: ISlot[];
  fri: ISlot[];
  sat: ISlot[];
  sun: ISlot[];

  createdAt?: Date;
  updatedAt?: Date;
}

// import { Types, Document } from 'mongoose';
// import { TWeekDay } from '../Artist/artist.constant';

import { Types } from 'mongoose';

// export interface IAvailabilitySlot extends Document {
//   start: string; // Format: 'HH:MM'
//   end: string; // Format: 'HH:MM'
// }

// export interface ISlot extends Document {
//   auth: Types.ObjectId;
//   artist: Types.ObjectId;
//   day: TWeekDay;
//   slots: IAvailabilitySlot[];
//   createdAt: Date;
//   updatedAt: Date;
// }

// import { Document, Types } from 'mongoose';

// export interface ISlot {
//   _id: Types.ObjectId;
//   startTime: string;
//   endTime: string;
//   startDateTime: Date;
//   endDateTime: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface IArtistSchedule extends Document {
//   artist: Types.ObjectId;
//   mon: ISlot[];
//   tue: ISlot[];
//   wed: ISlot[];
//   thu: ISlot[];
//   fri: ISlot[];
//   sat: ISlot[];
//   sun: ISlot[];

//   createdAt: Date;
//   updatedAt: Date;
// }

// One break per day, always 7 days in DB

export interface IDaySchedule {
  startTime: string | null;
  startTimeinMinute: number | null;
  endTime: string | null;
  endTimeinMinute: number | null;
  off: boolean;
}

export interface IWeeklySchedule {
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
}

export interface IOffDays {
  startDate: Date | null;
  endDate: Date | null;
}

export interface IArtistSchedule {
  artistId: Types.ObjectId;
  weeklySchedule: IWeeklySchedule;
  activeGuestSpot: Types.ObjectId | null;
  offDays: IOffDays;
}

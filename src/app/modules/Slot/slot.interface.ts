// import { Types, Document } from 'mongoose';
// import { TWeekDay } from '../Artist/artist.constant';

import { Types } from "mongoose";

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

// import { Document, Types } from 'mongoose';

// export interface ISlot {
//   _id: Types.ObjectId;
//   startTime: string;
//   endTime: string;
//   startDateTime: Date;
//   endDateTime: Date;
//   createdAt?: Date;
//   updatedAt?: Date;
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

//   createdAt?: Date;
//   updatedAt?: Date;
// }


// One break per day, always 7 days in DB
interface BreakTime {
  start: string | null; 
  end: string | null;   
}

export interface DaySchedule {
  start: string | null; 
  end: string | null;   
  breaks: BreakTime;     
  off: boolean;         
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface Exception {
  date: Date; 
  type: "off" | "special";
  start?: string;
  end?: string;
  breaks?: BreakTime;
}

export interface IArtistSchedule {
  artistId: Types.ObjectId;
  weeklySchedule: WeeklySchedule;
  exceptions: Exception[];
}

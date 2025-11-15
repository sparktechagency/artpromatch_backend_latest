import { Document, Types } from 'mongoose';
import { IOffDays } from '../Schedule/schedule.interface';

export interface IGuestSpot extends Document {
  artist: Types.ObjectId;

  location: {
    coordinates: [number, number];
    until: Date | null;
  };

  startDate: Date;
  endDate: Date;

  startTime: string;
  endTime: string;

  startTimeinMinute: number;
  endTimeinMinute: number;

  offDays: IOffDays;

  isActive: boolean;
}

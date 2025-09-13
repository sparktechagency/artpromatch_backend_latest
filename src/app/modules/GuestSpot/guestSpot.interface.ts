import { Document, Types } from 'mongoose';
import { offDays } from '../Schedule/schedule.interface';

export interface IGuestSpot extends Document {
  artist: Types.ObjectId;

  startDate: Date;
  endDate: Date;

  startTime: string;
  endTime: string;

  startTimeinMinute: number;
  endTimeinMinute: number;

  offDays: offDays;

  isActive: boolean;
}

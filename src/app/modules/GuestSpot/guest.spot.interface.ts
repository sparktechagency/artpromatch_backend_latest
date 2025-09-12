import { Document, Types } from 'mongoose';
import { offTimes } from '../Schedule/schedule.interface';

export interface IGuestSpot extends Document {
  artist: Types.ObjectId;

  startDate: Date;
  endDate: Date;

  startTime: string;
  endTime: string;

  startMin: number;
  endMin: number;

  offTime: offTimes;

  isActive: boolean;
}

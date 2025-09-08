import { Document, Types } from "mongoose";

export interface IGuestSpot extends Document {
  artistId: Types.ObjectId
  startDate: Date;    
  endDate: Date;       
  startTime: string;    
  endTime: string;      
  startMin: number;    
  endMin: number;
  isActive: boolean;       
}
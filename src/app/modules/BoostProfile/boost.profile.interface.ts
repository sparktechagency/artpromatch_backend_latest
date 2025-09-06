

import mongoose, { Document } from "mongoose";

export interface IArtistBoost extends Document {
  artistId: mongoose.Types.ObjectId; 
  startTime: Date;                   
  endTime: Date;                     
  duration: number;                 
  isActive: boolean;                 
  createdAt: Date;
  updatedAt: Date;
}
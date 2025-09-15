import { Document, Types } from 'mongoose';

export interface TServicePayload {
  title: string;
  description: string;
  bodyLocatioin: string;
  totalDuration: string;
  sessionDuration: string;
  category: "short" | "long";
  pricingType: "hourly" | "fixed"
  hourlyRate?: number;
  fixedPrice?: number;
  bufferTimeInMinutes: number;
}

export type TServiceImages = {
  images: Express.Multer.File[];
  thumbnail: Express.Multer.File[];
};

export const TattooBodyParts = {
  // Arms
  UPPER_ARM: "upper arm",
  FOREARM: "forearm",
  HALF_SLEEVE: "half sleeve",
  FULL_SLEEVE: "full sleeve",
  ELBOW: "elbow",
  WRIST: "wrist",
  FULL_HAND: "full hand",
  FINGERS: "fingers",

  // Legs
  THIGH: "thigh",
  CALF: "calf",
  SHIN: "shin",
  ANKLE: "ankle",
  FOOT: "foot",
  TOES: "toes",

  // Torso
  CHEST: "chest",
  BACK_UPPER: "back upper",
  BACK_LOWER: "back lower",
  BACK_FULL: "back full",
  SHOULDER: "shoulder",
  NECK: "neck",
  NAPE: "nape",
  STERNUM: "sternum",
  COLLARBONE: "collarbone",
  HIPS: "hips",
  BUTTOCKS: "buttocks",

  // Face / Head
  BEHIND_EAR: "behind_ear",
  FACE: "face",
} as const;
export type TattooBodyPart = (typeof TattooBodyParts)[keyof typeof TattooBodyParts]


export interface IService extends Document {
  _id: Types.ObjectId;
  artist: Types.ObjectId;
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  bodyLocation: TattooBodyPart;
  sessionType: 'short' | 'long';
  price: number
  totalCompletedOrder: number;
  totalReviewCount: number;
  avgRating: number;
  isDeleted: boolean;
}

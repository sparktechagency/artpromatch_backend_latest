import { Document, Types } from 'mongoose';

export interface TServicePayload {
  title: string;
  description: string;
  price: number;
  durationInMinutes: number;
  bufferTimeInMinutes: number;
}

export type TServiceImages = {
  images: Express.Multer.File[];
  thumbnail: Express.Multer.File[];
};

export const TattooBodyParts = {
  // Arms
  UPPER_ARM: "upper_arm",
  FOREARM: "forearm",
  HALF_SLEEVE: "half_sleeve",
  FULL_SLEEVE: "full_sleeve",
  ELBOW: "elbow",
  WRIST: "wrist",
  FULL_HAND: "full_hand",
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
  BACK_UPPER: "back_upper",
  BACK_LOWER: "back_lower",
  BACK_FULL: "back_full",
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
};
export type TattooBodyPart = (typeof TattooBodyParts)[keyof typeof TattooBodyParts]


export interface IService extends Document {
  _id: Types.ObjectId;
  artist: Types.ObjectId;

  title: string;
  description: string;
  price: number;

  thumbnail: string;
  images: string[];
  bodyParts: TattooBodyPart;
  durationInMinutes: number;
  bufferTimeInMinutes: number;

  totalCompletedOrder: number;
  totalReviewCount: number;
  avgRating: number;

  isDeleted: boolean;
}

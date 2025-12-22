import cloudinary from "../config/cloudinary.config";
import { getCloudinaryPublicId } from "./getCloudinaryPublicId";

export const deleteImageFromCloudinary = async (imageUrl:string) => {
  try {
    console.log({deleted_image: imageUrl})
    const publicId = getCloudinaryPublicId(imageUrl)
    console.log({publicId: publicId})
    const result = await cloudinary.uploader.destroy(publicId as string);
    return result;
  } catch (error) {
    throw error;
  }
};

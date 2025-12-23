import cloudinary from '../config/cloudinary.config';
import { getCloudinaryPublicId } from './getCloudinaryPublicId';

export const deleteImageFromCloudinary = async (imageUrl: string) => {
  const publicId = getCloudinaryPublicId(imageUrl);
  const result = await cloudinary.uploader.destroy(publicId as string);
  return result;
};

import cloudinary from '../config/cloudinary.config';
import streamifier from 'streamifier';

export const uploadToCloudinary = (
  file: Express.Multer.File,
  folderName:
    | 'profile_images'
    | 'services_images'
    | 'services_thumbnail'
    | 'folder_images'
    | 'kyc_images'
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

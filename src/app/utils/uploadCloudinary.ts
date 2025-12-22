
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.config';

export const uploadToCloudinary = (file: Express.Multer.File,  folder: 'profile_images' | 'services_images' | 'folder_images') => {
    
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id:
          file.originalname
            .replace(/\.[^/.]+$/, '')
            .toLowerCase()
            .replace(/\s+/g, '-') +
          '-' +
          Date.now(),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

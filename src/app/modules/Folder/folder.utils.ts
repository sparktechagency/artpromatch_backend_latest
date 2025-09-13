import fs from 'fs';

export const deleteSomeMulterFiles = (files: Express.Multer.File[]) => {
  files?.forEach((file) => deleteSingleImage(file.path));
};

export const deleteSomeImages = (images: string[]) => {
  images?.forEach((image) => deleteSingleImage(image));
};

export const deleteSingleImage = (file: string) => {
  fs.unlink(file, () => {});
};

export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

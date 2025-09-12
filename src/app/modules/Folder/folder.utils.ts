import fs from 'fs';

export const deleteFiles = (files: Express.Multer.File[]) => {
  files?.forEach((file) => fs.unlink(file.path, () => {}));
};

export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

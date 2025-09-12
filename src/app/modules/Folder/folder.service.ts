import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Folder from './folder.model';
import { IFolder } from './folder.interface';
import fs from 'fs';
import { deleteFiles, toTitleCase } from './folder.utils';

// createFolderIntoDB
const createFolderIntoDB = async (
  userData: IAuth,
  payload: Pick<IFolder, 'name' | 'for'>,
  files: Express.Multer.File[]
) => {
  if (files && files?.length > 50) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more then 50 images in a folder. Create a new one!"
    );
  }

  // transfer name to Title Case
  payload.name = toTitleCase(payload.name);

  const folder = await Folder.findOne({
    name: payload.name,
    owner: userData.id,
  });

  if (folder) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  return await Folder.create({
    owner: userData.id,
    images: files?.length ? files.map((file) => file.path) : [],
    ...payload,
  });
};

// updateFolderIntoDB
const updateFolderIntoDB = async (
  folderId: string,
  userData: IAuth,
  payload: Pick<IFolder, 'name' | 'for'>
) => {
  const folder = await Folder.findOne({
    _id: folderId,
    owner: userData.id,
  });

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  // transfer name to Title Case
  payload.name = toTitleCase(payload.name);

  const duplicate = await Folder.findOne({
    _id: { $ne: folderId },
    owner: userData.id,
    name: payload.name,
  });

  if (duplicate) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  folder.name = payload.name;
  folder.for = payload.for;

  await folder.save();

  return folder;
};

// addImagesToFolderIntoDB
const addImagesToFolderIntoDB = async (
  folderId: string,
  userData: IAuth,
  files: Express.Multer.File[]
) => {
  if (!files || !files.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required!');
  }

  const folder = await Folder.findOne({
    _id: folderId,
    owner: userData.id,
  });

  if (!folder) {
    deleteFiles(files);
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  if (folder.images.length + files.length > 50) {
    deleteFiles(files);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more than 50 images in a folder. Create a new one!"
    );
  }

  // folder.images.push(...files.map((file) => file.path));

  const newFiles = files.map((file) => file.path);
  // folder.images.push(
  //   ...newFiles.filter((file) => !folder.images.includes(file))
  // );
  // await folder.save();

  // $push does't avoid duplicate push
  // const updatedFolder = await Folder.findByIdAndUpdate(
  //   folderId,
  //   { $push: { images: { $each: newFiles } } },
  //   { new: true }
  // );

  // $addToSet avoids duplicate push
  const updatedFolder = await Folder.findByIdAndUpdate(
    folderId,
    { $addToSet: { images: { $each: newFiles } } },
    { new: true }
  );

  // return folder;
  return updatedFolder;
};

// removeImageFromFolderFromDB
const removeImageFromFolderFromDB = async (
  folderId: string,
  imageUrl: string
) => {
  const folder = await Folder.findById(folderId);

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  // Check if image exists in the folder
  if (!folder.images.includes(imageUrl)) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found in this folder!');
  }

  // Remove image from DB
  const updatedFolder = await Folder.findByIdAndUpdate(
    folderId,
    { $pull: { images: imageUrl } },
    { new: true }
  );

  // Remove file physically from storage
  fs.unlink(imageUrl, () => {});

  return updatedFolder;
};

// removeFolderFromDB
const removeFolderFromDB = async (folderId: string, userData: IAuth) => {
  if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
    const folder = await Folder.findByIdAndDelete(folderId);

    if (!folder) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists!');
    }
    folder.images?.forEach((images) => fs.unlink(images, () => {}));
  } else {
    const folder = await Folder.findOneAndDelete({
      _id: folderId,
      owner: userData.id,
    });

    if (!folder) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists!');
    }
    folder.images?.forEach((images) => fs.unlink(images, () => {}));
  }

  return null;
};

export const FolderService = {
  createFolderIntoDB,
  updateFolderIntoDB,
  addImagesToFolderIntoDB,
  removeImageFromFolderFromDB,
  removeFolderFromDB,
};

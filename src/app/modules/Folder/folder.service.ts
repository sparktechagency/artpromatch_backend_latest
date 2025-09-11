import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Folder from './folder.model';
import { IFolder } from './folder.interface';
import fs from 'fs';

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
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  folder.name = payload.name;
  folder.for = payload.for;
  await folder.save();

  return folder;
};

// uploadFileToFolderIntoDB
const uploadFileToFolderIntoDB = async (
  folderId: string,
  userData: IAuth,
  files: Express.Multer.File[]
) => {
  if (!files || !files?.length) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required');
  }

  if (files && files?.length > 50) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more then 50 images in a folder!"
    );
  }

  const folder = await Folder.findOne({
    _id: folderId,
    owner: userData.id,
  });

  if (!folder) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  if (folder?.images.length + files?.length > 50) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more then 50 images in a folder!"
    );
  }

  folder.images = [...folder.images, ...files.map((file) => file.path)];
  await folder.save();

  return folder;
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
  uploadFileToFolderIntoDB,
  removeFolderFromDB,
};

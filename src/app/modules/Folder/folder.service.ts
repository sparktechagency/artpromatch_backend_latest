import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Folder from './folder.model';
import { IFolder } from './folder.interface';
import {
  deleteSomeMulterFiles,
  deleteSingleImage,
  deleteSomeImages,
  toTitleCase,
} from './folder.utils';

// getAllFoldersFromDB
const getAllFoldersFromDB = async (userData: IAuth) => {
  const folders = await Folder.find({ owner: userData._id }).sort({
    name: 1,
  });

  if (!folders || folders.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No folders found for this user!');
  }

  return folders;
};

// getSingleFolderFromDB
const getSingleFolderFromDB = async (userData: IAuth, folderId: string) => {
  const folder = await Folder.findOne({
    _id: folderId,
    owner: userData._id,
  });

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  return folder;
};

// createFolderIntoDB
const createFolderIntoDB = async (
  userData: IAuth,
  payload: Pick<IFolder, 'name' | 'for'>,
  files: Express.Multer.File[]
) => {
  if (files && files?.length > 50) {
    deleteSomeMulterFiles(files);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more then 50 images in a folder. Create a new one!"
    );
  }

  // transfer name to Title Case
  payload.name = toTitleCase(payload.name);

  const folder = await Folder.findOne({
    name: payload.name,
    owner: userData._id,
  });

  if (folder) {
    deleteSomeMulterFiles(files);
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  return await Folder.create({
    owner: userData._id,
    images: files?.length
      ? files.map((file) => file.path.replace(/\\/g, '/'))
      : [],
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
    owner: userData._id,
  });

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  // transfer name to Title Case
  payload.name = toTitleCase(payload.name);

  const duplicate = await Folder.findOne({
    _id: { $ne: folderId },
    owner: userData._id,
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
    owner: userData._id,
  });

  if (!folder) {
    deleteSomeMulterFiles(files);
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  if (folder.images.length + files.length > 50) {
    deleteSomeMulterFiles(files);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more than 50 images in a folder. Create a new one!"
    );
  }

  // folder.images.push(...files.map((file) => file.path.replace(/\\/g, '/')));

  const newFiles = files.map((file) => file.path.replace(/\\/g, '/'));
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
  deleteSingleImage(imageUrl);
  return updatedFolder;
};

// removeFolderFromDB
const removeFolderFromDB = async (folderId: string, userData: IAuth) => {
  if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
    const folder = await Folder.findByIdAndDelete(folderId);

    if (!folder) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists!');
    }
    deleteSomeImages(folder.images);
  } else {
    const folder = await Folder.findOneAndDelete({
      _id: folderId,
      owner: userData._id,
    });

    if (!folder) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists!');
    }
    deleteSomeImages(folder.images);
  }

  return null;
};

export const FolderService = {
  getAllFoldersFromDB,
  getSingleFolderFromDB,
  createFolderIntoDB,
  updateFolderIntoDB,
  addImagesToFolderIntoDB,
  removeImageFromFolderFromDB,
  removeFolderFromDB,
};

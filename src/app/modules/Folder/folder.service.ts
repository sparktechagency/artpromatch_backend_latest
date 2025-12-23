import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Folder from './folder.model';
import { IFolder } from './folder.interface';
import { toTitleCase } from './folder.utils';
import { uploadToCloudinary } from '../../utils/uploadFileToCloudinary';
import { deleteImageFromCloudinary } from '../../utils/deleteImageFromCloudinary';

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
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  const uploaded = files?.length
    ? await Promise.all(
        files.map((file) => uploadToCloudinary(file, 'folder_images'))
      )
    : [];

  const imageUrls = uploaded.map((u) => u.secure_url);

  try {
    return await Folder.create({
      owner: userData._id,
      images: imageUrls,
      ...payload,
    });
  } catch (err) {
    if (imageUrls.length) {
      await Promise.all(imageUrls.map((url) => deleteImageFromCloudinary(url)));
    }
    throw err;
  }
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
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  if (folder.images.length + files.length > 50) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can't upload more than 50 images in a folder. Create a new one!"
    );
  }

  // folder.images.push(...files.map((file) => file.path.replace(/\\/g, '/')));

  const uploaded = await Promise.all(
    files.map((file) => uploadToCloudinary(file, 'folder_images'))
  );

  const newFiles = uploaded.map((u) => u.secure_url);
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
  try {
    const updatedFolder = await Folder.findByIdAndUpdate(
      folderId,
      { $addToSet: { images: { $each: newFiles } } },
      { new: true }
    );

    if (!updatedFolder) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to update folder'
      );
    }

    return updatedFolder;
  } catch (err) {
    if (newFiles.length) {
      await Promise.all(newFiles.map((url) => deleteImageFromCloudinary(url)));
    }
    throw err;
  }
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

  if (typeof imageUrl === 'string' && imageUrl.includes('/upload/')) {
    await deleteImageFromCloudinary(imageUrl);
  }
  return updatedFolder;
};

// removeFolderFromDB
const removeFolderFromDB = async (folderId: string, userData: IAuth) => {
  if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
    const folder = await Folder.findByIdAndDelete(folderId);

    if (!folder) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists!');
    }
    await Promise.all(
      folder.images.map((img) =>
        img.includes('/upload/')
          ? deleteImageFromCloudinary(img)
          : Promise.resolve()
      )
    );
  } else {
    const folder = await Folder.findOneAndDelete({
      _id: folderId,
      owner: userData._id,
    });

    if (!folder) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists!');
    }
    await Promise.all(
      folder.images.map((img) =>
        img.includes('/upload/')
          ? deleteImageFromCloudinary(img)
          : Promise.resolve()
      )
    );
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

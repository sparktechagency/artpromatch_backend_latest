import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import httpStatus from 'http-status';
import Folder from './folder.model';
import { TFolderPayload } from './folder.validation';
import fs from 'fs';
import Artist from '../Artist/artist.model';

const saveFolderIntoDB = async (
  user: IAuth,
  payload: TFolderPayload,
  files: Express.Multer.File[] | undefined
) => {
  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required');
  }

  const folder = await Folder.findOne({ name: payload.name, auth: user._id });

  if (folder) {
    files?.forEach((file) => fs.unlink(file.path, () => {}));
    throw new AppError(httpStatus.BAD_REQUEST, 'Folder name already exists!');
  }

  return await Folder.create({
    auth: user._id,
    images: files.map((file) => file.path),
    ...payload,
  });
};

const removeFolderFromDB = async (folderId: string) => {
  const folder = await Folder.findByIdAndDelete(folderId);

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not exists');
  }

  const artist = await Artist.findOne({ auth: folder.auth });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  return await Artist.findByIdAndUpdate(
    artist._id,
    {
      $pull: {
        portfolio: { folder: folderId },
        flashes: { folder: folderId },
      },
    },
    { new: true }
  );
};

export const FolderService = {
  saveFolderIntoDB,
  removeFolderFromDB,
};

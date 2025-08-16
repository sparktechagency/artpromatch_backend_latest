/* eslint-disable no-undef */
import status from 'http-status';
import { AppResponse, asyncHandler } from '../../utils';
import { FolderService } from './folder.service';

const saveFolder = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await FolderService.saveFolderIntoDB(
    req.user,
    req.body,
    files
  );
  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Folder saved successfully'));
});

const removeFolder = asyncHandler(async (req, res) => {
  const folderId = req.params.folderId;
  const result = await FolderService.removeFolderFromDB(folderId);

  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Folder removed successfully'));
});

export const FolderController = {
  saveFolder,
  removeFolder,
};

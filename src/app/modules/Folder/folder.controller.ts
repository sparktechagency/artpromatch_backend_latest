import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { FolderService } from './folder.service';
import sendResponse from '../../utils/sendResponse';

const saveFolder = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await FolderService.saveFolderIntoDB(
    req.user,
    req.body,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder saved successfully!',
    data: result,
  });
});

const removeFolder = asyncHandler(async (req, res) => {
  const folderId = req.params.folderId;
  const result = await FolderService.removeFolderFromDB(folderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder removed successfully!',
    data: result,
  });
});

export const FolderController = {
  saveFolder,
  removeFolder,
};

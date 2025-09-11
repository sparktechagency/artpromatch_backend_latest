import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { FolderService } from './folder.service';
import sendResponse from '../../utils/sendResponse';

// createFolder
const createFolder = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const result = await FolderService.createFolderIntoDB(
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

// updateFolder
const updateFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const userData = req.user;
  const payload = req.body;

  const result = await FolderService.updateFolderIntoDB(
    folderId,
    userData,
    payload
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder updated successfully!',
    data: result,
  });
});

// uploadFileToFolder
const uploadFileToFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const userData = req.user;
  const files = req.files as Express.Multer.File[];

  const result = await FolderService.uploadFileToFolderIntoDB(
    folderId,
    userData,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Files uploaded successfully!',
    data: result,
  });
});

// removeFolder
const removeFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const userData = req.user;
  const result = await FolderService.removeFolderFromDB(folderId, userData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder removed successfully!',
    data: result,
  });
});

export const FolderController = {
  createFolder,
  updateFolder,
  uploadFileToFolder,
  removeFolder,
};

import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { FolderService } from './folder.service';
import sendResponse from '../../utils/sendResponse';

// getAllFolders
const getAllFolders = asyncHandler(async (req, res) => {
  const result = await FolderService.getAllFoldersFromDB(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folders retrieved successfully!',
    data: result,
  });
});

// getSingleFolder
const getSingleFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const result = await FolderService.getSingleFolderFromDB(req.user, folderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder retrieved successfully!',
    data: result,
  });
});

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

// addImagesToFolder
const addImagesToFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const userData = req.user;
  const files = req.files as Express.Multer.File[];

  const result = await FolderService.addImagesToFolderIntoDB(
    folderId,
    userData,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Images uploaded successfully!',
    data: result,
  });
});

// removeImageFromFolder
const removeImageFromFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { image } = req.body;

  const result = await FolderService.removeImageFromFolderFromDB(
    folderId,
    image
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Image removed successfully!',
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
  getAllFolders,
  getSingleFolder,
  createFolder,
  updateFolder,
  addImagesToFolder,
  removeImageFromFolder,
  removeFolder,
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const folder_service_1 = require("./folder.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// getAllFolders
const getAllFolders = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await folder_service_1.FolderService.getAllFoldersFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Folders retrieved successfully!',
        data: result,
    });
});
// getSingleFolder
const getSingleFolder = (0, utils_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const result = await folder_service_1.FolderService.getSingleFolderFromDB(req.user, folderId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Folder retrieved successfully!',
        data: result,
    });
});
// createFolder
const createFolder = (0, utils_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    const result = await folder_service_1.FolderService.createFolderIntoDB(req.user, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Folder saved successfully!',
        data: result,
    });
});
// updateFolder
const updateFolder = (0, utils_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const userData = req.user;
    const payload = req.body;
    const result = await folder_service_1.FolderService.updateFolderIntoDB(folderId, userData, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Folder updated successfully!',
        data: result,
    });
});
// addImagesToFolder
const addImagesToFolder = (0, utils_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const userData = req.user;
    const files = req.files;
    const result = await folder_service_1.FolderService.addImagesToFolderIntoDB(folderId, userData, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Images uploaded successfully!',
        data: result,
    });
});
// removeImageFromFolder
const removeImageFromFolder = (0, utils_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const { image } = req.body;
    const result = await folder_service_1.FolderService.removeImageFromFolderFromDB(folderId, image);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Image removed successfully!',
        data: result,
    });
});
// removeFolder
const removeFolder = (0, utils_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const userData = req.user;
    const result = await folder_service_1.FolderService.removeFolderFromDB(folderId, userData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Folder removed successfully!',
        data: result,
    });
});
exports.FolderController = {
    getAllFolders,
    getSingleFolder,
    createFolder,
    updateFolder,
    addImagesToFolder,
    removeImageFromFolder,
    removeFolder,
};

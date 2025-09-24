"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderService = void 0;
const utils_1 = require("../../utils");
const http_status_1 = __importDefault(require("http-status"));
const folder_model_1 = __importDefault(require("./folder.model"));
const folder_utils_1 = require("./folder.utils");
// getAllFoldersFromDB
const getAllFoldersFromDB = async (userData) => {
    const folders = await folder_model_1.default.find({ owner: userData._id }).sort({
        name: 1,
    });
    if (!folders || folders.length === 0) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'No folders found for this user!');
    }
    return folders;
};
// getSingleFolderFromDB
const getSingleFolderFromDB = async (userData, folderId) => {
    const folder = await folder_model_1.default.findOne({
        _id: folderId,
        owner: userData._id,
    });
    if (!folder) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Folder not found!');
    }
    return folder;
};
// createFolderIntoDB
const createFolderIntoDB = async (userData, payload, files) => {
    if (files && files?.length > 50) {
        (0, folder_utils_1.deleteSomeMulterFiles)(files);
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, "You can't upload more then 50 images in a folder. Create a new one!");
    }
    // transfer name to Title Case
    payload.name = (0, folder_utils_1.toTitleCase)(payload.name);
    const folder = await folder_model_1.default.findOne({
        name: payload.name,
        owner: userData._id,
    });
    if (folder) {
        (0, folder_utils_1.deleteSomeMulterFiles)(files);
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Folder name already exists!');
    }
    return await folder_model_1.default.create({
        owner: userData._id,
        images: files?.length
            ? files.map((file) => file.path.replace(/\\/g, '/'))
            : [],
        ...payload,
    });
};
// updateFolderIntoDB
const updateFolderIntoDB = async (folderId, userData, payload) => {
    const folder = await folder_model_1.default.findOne({
        _id: folderId,
        owner: userData._id,
    });
    if (!folder) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Folder not found!');
    }
    // transfer name to Title Case
    payload.name = (0, folder_utils_1.toTitleCase)(payload.name);
    const duplicate = await folder_model_1.default.findOne({
        _id: { $ne: folderId },
        owner: userData._id,
        name: payload.name,
    });
    if (duplicate) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Folder name already exists!');
    }
    folder.name = payload.name;
    folder.for = payload.for;
    await folder.save();
    return folder;
};
// addImagesToFolderIntoDB
const addImagesToFolderIntoDB = async (folderId, userData, files) => {
    if (!files || !files.length) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Files are required!');
    }
    const folder = await folder_model_1.default.findOne({
        _id: folderId,
        owner: userData._id,
    });
    if (!folder) {
        (0, folder_utils_1.deleteSomeMulterFiles)(files);
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Folder not found!');
    }
    if (folder.images.length + files.length > 50) {
        (0, folder_utils_1.deleteSomeMulterFiles)(files);
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, "You can't upload more than 50 images in a folder. Create a new one!");
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
    const updatedFolder = await folder_model_1.default.findByIdAndUpdate(folderId, { $addToSet: { images: { $each: newFiles } } }, { new: true });
    // return folder;
    return updatedFolder;
};
// removeImageFromFolderFromDB
const removeImageFromFolderFromDB = async (folderId, imageUrl) => {
    const folder = await folder_model_1.default.findById(folderId);
    if (!folder) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Folder not found!');
    }
    // Check if image exists in the folder
    if (!folder.images.includes(imageUrl)) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Image not found in this folder!');
    }
    // Remove image from DB
    const updatedFolder = await folder_model_1.default.findByIdAndUpdate(folderId, { $pull: { images: imageUrl } }, { new: true });
    // Remove file physically from storage
    (0, folder_utils_1.deleteSingleImage)(imageUrl);
    return updatedFolder;
};
// removeFolderFromDB
const removeFolderFromDB = async (folderId, userData) => {
    if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
        const folder = await folder_model_1.default.findByIdAndDelete(folderId);
        if (!folder) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Folder not exists!');
        }
        (0, folder_utils_1.deleteSomeImages)(folder.images);
    }
    else {
        const folder = await folder_model_1.default.findOneAndDelete({
            _id: folderId,
            owner: userData._id,
        });
        if (!folder) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Folder not exists!');
        }
        (0, folder_utils_1.deleteSomeImages)(folder.images);
    }
    return null;
};
exports.FolderService = {
    getAllFoldersFromDB,
    getSingleFolderFromDB,
    createFolderIntoDB,
    updateFolderIntoDB,
    addImagesToFolderIntoDB,
    removeImageFromFolderFromDB,
    removeFolderFromDB,
};

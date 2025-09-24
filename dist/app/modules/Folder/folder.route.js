"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderRoutes = void 0;
const express_1 = require("express");
const middlewares_1 = require("../../middlewares");
const folder_validation_1 = require("./folder.validation");
const folder_controller_1 = require("./folder.controller");
const auth_constant_1 = require("../Auth/auth.constant");
const lib_1 = require("../../lib");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = (0, express_1.Router)();
// getAllFolders
router.route('/').get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), folder_controller_1.FolderController.getAllFolders);
// getSingleFolder
router
    .route('/:folderId')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), folder_controller_1.FolderController.getSingleFolder);
// createFolder
router
    .route('/')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), lib_1.upload.array('files'), (0, validateRequest_1.validateRequestFromFormData)(folder_validation_1.FolderValidation.createOrUpdateFolderSchema), folder_controller_1.FolderController.createFolder);
// updateFolder
router
    .route('/:folderId')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, validateRequest_1.validateRequest)(folder_validation_1.FolderValidation.createOrUpdateFolderSchema), folder_controller_1.FolderController.updateFolder);
// addImagesToFolder
router
    .route('/add/:folderId')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), lib_1.upload.array('files'), folder_controller_1.FolderController.addImagesToFolder);
// removeImageFromFolder
router
    .route('/remove-image/:folderId')
    .delete((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, validateRequest_1.validateRequest)(folder_validation_1.FolderValidation.removeImageFromFolderSchema), folder_controller_1.FolderController.removeImageFromFolder);
// removeFolder
router
    .route('/remove-folder/:folderId')
    .delete((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST, auth_constant_1.ROLE.ADMIN, auth_constant_1.ROLE.SUPER_ADMIN), folder_controller_1.FolderController.removeFolder);
exports.FolderRoutes = router;

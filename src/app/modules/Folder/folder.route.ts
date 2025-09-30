import { Router } from 'express';
import { auth } from '../../middlewares';
import { FolderValidation } from './folder.validation';
import { FolderController } from './folder.controller';
import { ROLE } from '../auth/auth.constant';
import { upload } from '../../lib';
import {
  validateRequest,
  validateRequestFromFormData,
} from '../../middlewares/validateRequest';

const router = Router();

// getAllFolders
router.route('/').get(auth(ROLE.ARTIST), FolderController.getAllFolders);

// getSingleFolder
router
  .route('/:folderId')
  .get(auth(ROLE.ARTIST), FolderController.getSingleFolder);

// createFolder
router
  .route('/')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    validateRequestFromFormData(FolderValidation.createOrUpdateFolderSchema),
    FolderController.createFolder
  );

// updateFolder
router
  .route('/:folderId')
  .patch(
    auth(ROLE.ARTIST),
    validateRequest(FolderValidation.createOrUpdateFolderSchema),
    FolderController.updateFolder
  );

// addImagesToFolder
router
  .route('/add/:folderId')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    FolderController.addImagesToFolder
  );

// removeImageFromFolder
router
  .route('/remove-image/:folderId')
  .delete(
    auth(ROLE.ARTIST),
    validateRequest(FolderValidation.removeImageFromFolderSchema),
    FolderController.removeImageFromFolder
  );

// removeFolder
router
  .route('/remove-folder/:folderId')
  .delete(
    auth(ROLE.ARTIST, ROLE.ADMIN, ROLE.SUPER_ADMIN),
    FolderController.removeFolder
  );

export const FolderRoutes = router;

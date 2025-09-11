import { Router } from 'express';
import { auth } from '../../middlewares';
import { FolderValidation } from './folder.validation';
import { FolderController } from './folder.controller';
// import { upload } from '../../lib';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../Auth/auth.constant';
import { upload } from '../../lib';

const router = Router();

// createFolder
router
  .route('/')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    validateRequest(FolderValidation.createFolderSchema),
    FolderController.createFolder
  );

// updateFolder
router.route('/update/:folderId').post(
  auth(ROLE.ARTIST),
  validateRequest(FolderValidation.createFolderSchema),
  FolderController.updateFolder
);

// uploadFileToFolder
router
  .route('/upload:folderId')
  .post(
    auth(ROLE.ARTIST),
    upload.array('files'),
    FolderController.uploadFileToFolder
  );

// removeFolder
router
  .route('/:folderId')
  .delete(
    auth(ROLE.ARTIST, ROLE.ADMIN, ROLE.SUPER_ADMIN),
    FolderController.removeFolder
  );

export const FolderRoutes = router;

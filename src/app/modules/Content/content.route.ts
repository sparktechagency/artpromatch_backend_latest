
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { Router } from 'express';
import { contentZodValidation } from './content.zod';
import { ContentController } from './content.controller';


const router = Router();

router.post(
  '/create-or-update',
  auth(ROLE.ADMIN,ROLE.SUPER_ADMIN),
  validateRequest(contentZodValidation.createOrUpdatePageSchema),
  ContentController.createContentOrUpdate
);


router.get(
  '/retrieve',
  auth(ROLE.ADMIN,ROLE.SUPER_ADMIN),
  ContentController.getAllContent
);


router.get(
  '/retrieve/:type',
  auth(ROLE.ADMIN,ROLE.SUPER_ADMIN),
  ContentController.getContentByType
);


export const contentRoutes = router;

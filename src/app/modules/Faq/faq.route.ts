import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { faqController } from './faq.controller';
import { FaqValidation } from './faq.zod.validation';

const router = Router();

// createFaqByAdmin
router.post(
  '/create',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest(FaqValidation.createFaqSchemaByAdmin),
  faqController.createFaqByAdmin
);

router.post(
  '/create/by-user',
  validateRequest(FaqValidation.createFaqSchemaByUser),
  faqController.createFaqByUser
);

// getAllFaqForAdmin
router.get(
  '/',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  faqController.getAllFaqForAdmin
);

// getAllFaqForUser
router.get('/users', faqController.getAllFaqForUser);

// updateFaq
router.patch(
  '/update/:id',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest(FaqValidation.updateFaqSchema),
  faqController.updateFaq
);

// deleteFaq
router.delete(
  '/delete/:id',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  faqController.deleteFaq
);

export const faqRoutes = router;

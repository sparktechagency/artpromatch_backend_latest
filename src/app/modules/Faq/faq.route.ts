import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { faqController } from './faq.controller';
import { FaqValidation } from './faq.zod.validation';

const router = Router();

router.post(
  '/create',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest(FaqValidation.createFaqSchema),
  faqController.createFaq
);

router.get(
  '/',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  faqController.getAllFaqForAdmin
);

router.get(
  '/users',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  faqController.getAllFaqForUser
);


router.patch(
  '/update/:id',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest(FaqValidation.updateFaqSchema),
  faqController.updateFaq
);

export const faqRoutes = router;

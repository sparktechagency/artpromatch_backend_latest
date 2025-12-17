import { Router } from 'express';
import { auth } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { PaymentHistoryController } from './paymentHistory.controller';

const router = Router();

// getAllPaymentsForClientAndArtist
router
  .route('/client-artist')
  .get(
    auth(ROLE.CLIENT, ROLE.ARTIST),
    PaymentHistoryController.getAllPaymentsForClientAndArtist
  );

// getAllPaymentsForAdmin
router
  .route('/admin')
  .get(auth(ROLE.ADMIN, ROLE.SUPER_ADMIN), PaymentHistoryController.getAllPaymentsForAdmin);

export const PaymentHistoryRoutes = router;

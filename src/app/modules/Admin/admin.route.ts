import { Router } from 'express';
import { auth } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { AdminController } from './admin.controller';

const router = Router();

// getAllArtistsFolders
router
  .route('/folders')
  .get(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.getAllArtistsFolders
  );

// // changeStatusOnFolder
// router
//   .route('/folders/:id')
//   .patch(
//     auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
//     AdminController.changeStatusOnFolder
//   );

// verifyArtistByAdmin
router
  .route('/verify-artist/:artistId')
  .patch(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.verifyArtistByAdmin
  );

// verifyBusinessByAdmin
router
  .route('/verify-business/:businessId')
  .patch(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.verifyBusinessByAdmin
  );

// fetchAllArtists
router.route('/fetch-artists').get(AdminController.fetchAllArtists);

// fetchAllBusinesses
router.route('/fetch-businesses').get(AdminController.fetchAllBusinesses);

// fetchAllClients
router.route('/fetch-clients').get(AdminController.fetchAllClients);

// fetchAllSecretReviews
router.route('/secret-reviews').get(AdminController.fetchAllSecretReviews);

export const AdminRoutes = router;

import { Router } from 'express';
import { ROLE } from '../Auth/auth.constant';
import { AdminController } from './admin.controller';
import { auth } from '../../middlewares';

const router = Router();

// 1. fetchDashboardPage
router
  .route('/dashboard')
  .get(auth(ROLE.SUPER_ADMIN, ROLE.ADMIN), AdminController.fetchDashboardPage);

// 2. getYearlyAppointmentStats
router
  .route('/dashboard/yearly-appoiontment')
  .get(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.getYearlyAppointmentStats
  );

// 3. getYearlyRevenueStats
router
  .route('/dashboard/yearly-revenue')
  .get(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.getYearlyRevenueStats
  );

// 4. getAllArtistsFolders
router
  .route('/folders')
  .get(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.getAllArtistsFolders
  );

// 5. verifyArtistByAdmin
router
  .route('/verify-artist/:artistId')
  .patch(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.verifyArtistByAdmin
  );

// 6. verifyBusinessByAdmin
router
  .route('/verify-business/:businessId')
  .patch(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.verifyBusinessByAdmin
  );

// 7. getAllBookingsForAdmin
router
  .route('/get-all-bookings')
  .get(
    auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
    AdminController.getAllBookingsForAdmin
  );

// 8. fetchAllClients
router.route('/fetch-clients').get(AdminController.fetchAllClients);

// 9. fetchAllArtists
router.route('/fetch-artists').get(AdminController.fetchAllArtists);

// 10. fetchAllBusinesses
router.route('/fetch-businesses').get(AdminController.fetchAllBusinesses);

// 11. fetchAllSecretReviews
router.route('/secret-reviews').get(auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),AdminController.fetchAllSecretReviews);

router.route('/services').get(auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),AdminController.getAllServices);

// // changeStatusOnFolder
// router
//   .route('/folders/:id')
//   .patch(
//     auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
//     AdminController.changeStatusOnFolder
//   );

export const AdminRoutes = router;

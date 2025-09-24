"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = require("express");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const admin_controller_1 = require("./admin.controller");
const router = (0, express_1.Router)();
// getAllArtistsFolders
router
    .route('/folders')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.SUPER_ADMIN, auth_constant_1.ROLE.ADMIN), admin_controller_1.AdminController.getAllArtistsFolders);
// // changeStatusOnFolder
// router
//   .route('/folders/:id')
//   .patch(
//     auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
//     AdminController.changeStatusOnFolder
//   );
// verifyArtistByAdmin
router
    .route('/dashboard')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.SUPER_ADMIN, auth_constant_1.ROLE.ADMIN, auth_constant_1.ROLE.ARTIST), admin_controller_1.AdminController.fetchDashboardPage);
router
    .route('/dashboard/yearly-revenue')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.SUPER_ADMIN, auth_constant_1.ROLE.ADMIN, auth_constant_1.ROLE.ARTIST), admin_controller_1.AdminController.getYearlyRevenueStats);
router
    .route('/dashboard/yearly-appoiontment')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.SUPER_ADMIN, auth_constant_1.ROLE.ADMIN, auth_constant_1.ROLE.ARTIST), admin_controller_1.AdminController.getYearlyAppointmentStats);
router
    .route('/verify-artist/:artistId')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.SUPER_ADMIN, auth_constant_1.ROLE.ADMIN), admin_controller_1.AdminController.verifyArtistByAdmin);
// verifyBusinessByAdmin
router
    .route('/verify-business/:businessId')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.SUPER_ADMIN, auth_constant_1.ROLE.ADMIN), admin_controller_1.AdminController.verifyBusinessByAdmin);
// fetchAllArtists
router.route('/fetch-artists').get(admin_controller_1.AdminController.fetchAllArtists);
// fetchAllBusinesses
router.route('/fetch-businesses').get(admin_controller_1.AdminController.fetchAllBusinesses);
// fetchAllClients
router.route('/fetch-clients').get(admin_controller_1.AdminController.fetchAllClients);
// fetchAllSecretReviews
router.route('/secret-reviews').get(admin_controller_1.AdminController.fetchAllSecretReviews);
exports.AdminRoutes = router;

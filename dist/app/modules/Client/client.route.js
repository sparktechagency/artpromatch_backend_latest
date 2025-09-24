"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRoutes = void 0;
const express_1 = require("express");
const client_controller_1 = require("./client.controller");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const client_validation_1 = require("./client.validation");
const router = (0, express_1.Router)();
// updateProfile
router
    .route('/personal-info')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(client_validation_1.ClientValidation.profileInfoSchema), client_controller_1.ClientController.updateProfile);
// updatePreferences
router
    .route('/preferences')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(client_validation_1.ClientValidation.preferencesSchema), client_controller_1.ClientController.updatePreferences);
// updateNotificationPreferences
router
    .route('/notification-preferences')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(client_validation_1.ClientValidation.notificationSchema), client_controller_1.ClientController.updateNotificationPreferences);
// updatePrivacySecuritySettings
router
    .route('/privacy-security')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(client_validation_1.ClientValidation.privacySecuritySchema), client_controller_1.ClientController.updatePrivacySecuritySettings);
// getDiscoverArtists
router.route('/discover').get((0, middlewares_1.auth)(), client_controller_1.ClientController.getDiscoverArtists);
router.route('/').get(client_controller_1.ClientController.getAllServices);
router
    .route('/radius')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT), (0, middlewares_1.validateRequest)(client_validation_1.ClientValidation.updateClientRadiusSchema), client_controller_1.ClientController.updateClientRadius);
exports.ClientRoutes = router;

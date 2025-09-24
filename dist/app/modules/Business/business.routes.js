"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRoutes = void 0;
const express_1 = require("express");
const business_controller_1 = require("./business.controller");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const business_validation_1 = require("./business.validation");
const router = (0, express_1.Router)();
router
    .route('/profile')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(business_validation_1.BusinessValidation.businessProfileSchema), business_controller_1.BusinessController.updateBusinessProfile);
router
    .route('/preferences')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(business_validation_1.BusinessValidation.businessPreferencesSchema), business_controller_1.BusinessController.updateBusinessPreferences);
router
    .route('/notification-preferences')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(business_validation_1.BusinessValidation.businessNotificationSchema), business_controller_1.BusinessController.updateBusinessNotificationPreferences);
router
    .route('/security-settings')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(business_validation_1.BusinessValidation.businessSecuritySettingsSchema), business_controller_1.BusinessController.updateBusinessSecuritySettings);
router
    .route('/get-artist')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), business_controller_1.BusinessController.fetchBusinessArtist);
// updateTimeOff
router
    .route('/time-off')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), (0, middlewares_1.validateRequest)(business_validation_1.BusinessValidation.timeOffSchema), business_controller_1.BusinessController.updateTimeOff);
// removeArtist
router
    .route('/resident-artist/:artistId')
    .delete(business_controller_1.BusinessController.removeArtist);
exports.BusinessRoutes = router;

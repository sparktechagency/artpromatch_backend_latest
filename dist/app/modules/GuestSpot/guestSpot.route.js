"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestSpotRoutes = void 0;
const express_1 = require("express");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const guestSpot_validation_1 = require("./guestSpot.validation");
const guestSpot_controller_1 = require("./guestSpot.controller");
const router = (0, express_1.Router)();
// createGuestSpot
router
    .route('/')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(guestSpot_validation_1.GuestSpotValidation.createGuestSpotSchema), guestSpot_controller_1.GuestSpotController.createGuestSpot);
// updateGuestSpot
router
    .route('/:guestSpotId')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(guestSpot_validation_1.GuestSpotValidation.updateGuestSpotSchema), guestSpot_controller_1.GuestSpotController.updateGuestSpot);
exports.GuestSpotRoutes = router;

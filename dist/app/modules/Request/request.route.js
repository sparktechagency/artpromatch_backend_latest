"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestRoute = void 0;
const express_1 = require("express");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const request_controller_1 = require("./request.controller");
const request_validation_1 = require("./request.validation");
const router = (0, express_1.Router)();
router
    .route('/send')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS, auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(request_validation_1.requestValidation.createRequestSchema), request_controller_1.RequestController.createRequest);
router
    .route('/')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS, auth_constant_1.ROLE.ARTIST), request_controller_1.RequestController.fetchMyRequests);
router
    .route('/')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), request_controller_1.RequestController.fetchMyRequests);
router
    .route('/:id')
    .put((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), request_controller_1.RequestController.statusChangedByArtist)
    .put((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), request_controller_1.RequestController.addToJoinStudio);
router
    .route('/studio/:id')
    .put((0, middlewares_1.auth)(auth_constant_1.ROLE.BUSINESS), request_controller_1.RequestController.addToJoinStudio);
exports.RequestRoute = router;

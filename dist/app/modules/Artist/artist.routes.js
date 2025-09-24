"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistRoutes = void 0;
const express_1 = require("express");
const artist_controller_1 = require("./artist.controller");
const middlewares_1 = require("../../middlewares");
const auth_constant_1 = require("../Auth/auth.constant");
const artist_validation_1 = require("./artist.validation");
const lib_1 = require("../../lib");
const slotValidation_1 = require("../../schema/slotValidation");
const service_zod_1 = require("../Service/service.zod");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = (0, express_1.Router)();
// getAllArtists
router.route('/').get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.getAllArtists);
// getOwnArtistData
router.route('/own').get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.getOwnArtistData);
// getSingleArtist
router
    .route('/single/:id')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.CLIENT, auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.getSingleArtist);
// updateArtistPersonalInfo
router
    .route('/')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(artist_validation_1.ArtistValidation.updateSchema), artist_controller_1.ArtistController.updateArtistPersonalInfo);
// updateArtistProfile
router
    .route('/profile')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(artist_validation_1.ArtistValidation.artistProfileSchema), artist_controller_1.ArtistController.updateArtistProfile);
// updateArtistPreferences
router
    .route('/preferences')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(artist_validation_1.ArtistValidation.artistPreferencesSchema), artist_controller_1.ArtistController.updateArtistPreferences);
// updateArtistNotificationPreferences
router
    .route('/notification-preferences')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(artist_validation_1.ArtistValidation.artistNotificationSchema), artist_controller_1.ArtistController.updateArtistNotificationPreferences);
// updateArtistPrivacySecuritySettings
router
    .route('/privacy-security')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(artist_validation_1.ArtistValidation.artistPrivacySecuritySchema), artist_controller_1.ArtistController.updateArtistPrivacySecuritySettings);
// updateArtistFlashes
router
    .route('/flashes')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), lib_1.upload.array('files'), artist_controller_1.ArtistController.updateArtistFlashes);
// updateArtistPortfolio
router
    .route('/portfolio')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), lib_1.upload.array('files'), artist_controller_1.ArtistController.updateArtistPortfolio);
// addArtistService
router.route('/service/create').post(lib_1.upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 },
]), (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, validateRequest_1.validateRequestFromFormData)(service_zod_1.ArtistServiceValidation.createServiceSchema), artist_controller_1.ArtistController.addArtistService);
// getServicesByArtist
router
    .route('/services')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.getServicesByArtist);
// updateArtistService
router.route('/service/update/:id').patch(lib_1.upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 },
]), (0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, validateRequest_1.validateRequestFromFormData)(service_zod_1.ArtistServiceValidation.updateServiceSchema), artist_controller_1.ArtistController.updateArtistServiceById);
// deleteArtistService
router
    .route('/service/delete/:id')
    .delete((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.deleteArtistService);
// removeImage
router
    .route('/remove-image')
    .delete((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.removeImage);
// saveArtistAvailability
router
    .route('/availability')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(slotValidation_1.SlotValidation.availabilitySchema), artist_controller_1.ArtistController.saveArtistAvailability);
router
    .route('/schedule')
    .get((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.getArtistSchedule);
router
    .route('/boost-profile')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.boostProfile);
// getAvailabilityExcludingTimeOff
// router
//   .route('/availability/:id')
//   .get(ArtistController.getAvailabilityExcludingTimeOff)
// setArtistTimeOff
router
    .route('/days-off')
    .patch((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), (0, middlewares_1.validateRequest)(artist_validation_1.ArtistValidation.setOffDaysSchema), artist_controller_1.ArtistController.setArtistTimeOff);
// createConnectedAccountAndOnboardingLinkForArtist
router
    .route('/create-onboarding-account')
    .post((0, middlewares_1.auth)(auth_constant_1.ROLE.ARTIST), artist_controller_1.ArtistController.createConnectedAccountAndOnboardingLinkForArtist);
router.route('/delete-account').post(artist_controller_1.ArtistController.deleteAccount);
exports.ArtistRoutes = router;

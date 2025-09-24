"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const admin_service_1 = require("./admin.service");
// getAllArtistsFolders
const getAllArtistsFolders = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await admin_service_1.AdminService.getAllArtistsFoldersFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Folder retrieved successfully!',
        data: result,
    });
});
// // changeStatusOnFolder
// const changeStatusOnFolder = asyncHandler(async (req, res) => {
//   const id = req.params.id;
//   const permission = req.body.permission;
//   const result = await AdminService.changeStatusOnFolder(id, permission);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Action is successful on folder!',
//     data: result,
//   });
// });
// verifyArtistByAdmin
const verifyArtistByAdmin = (0, utils_1.asyncHandler)(async (req, res) => {
    const artistId = req.params.artistId;
    const result = await admin_service_1.AdminService.verifyArtistByAdminIntoDB(artistId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artist verified successfully!',
        data: result,
    });
});
// verifyBusinessByAdmin
const verifyBusinessByAdmin = (0, utils_1.asyncHandler)(async (req, res) => {
    const businessId = req.params.businessId;
    const result = await admin_service_1.AdminService.verifyBusinessByAdminIntoDB(businessId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Business verified successfully!',
        data: result,
    });
});
// fetchAllArtists
const fetchAllArtists = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await admin_service_1.AdminService.fetchAllArtistsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Artists retrieved successFully!',
        data: result.data,
        meta: result.meta,
    });
});
// fetchAllBusinesses
const fetchAllBusinesses = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await admin_service_1.AdminService.fetchAllBusinessesFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Business retrieved successFully!',
        data: result.data,
        meta: result.meta,
    });
});
// fetchAllClients
const fetchAllClients = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await admin_service_1.AdminService.fetchAllClientsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Clients retrieved successFully!',
        data: result.data,
        meta: result.meta,
    });
});
// fetchAllSecretReviews
const fetchAllSecretReviews = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await admin_service_1.AdminService.fetchAllSecretReviewsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Reviews retrieved successFully!',
        data: result.data,
        meta: result.meta,
    });
});
const fetchDashboardPage = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await admin_service_1.AdminService.fetchDasboardPageData();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Dashboard data retrieved successFully!',
        data: result,
    });
});
const getYearlyAppointmentStats = (0, utils_1.asyncHandler)(async (req, res) => {
    const year = parseInt(req.query.year, 10);
    if (!year || isNaN(year)) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'year query param required (e.g. 2025)');
    }
    const result = await admin_service_1.AdminService.getYearlyAppointmentStats(year);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Dashboard data retrieved successFully!',
        data: result,
    });
});
const getYearlyRevenueStats = (0, utils_1.asyncHandler)(async (req, res) => {
    console.log(req.query);
    const year = parseInt(req.query.year, 10);
    console.log(year);
    if (!year || isNaN(year)) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'year query param required (e.g. 2025)');
    }
    const result = await admin_service_1.AdminService.getYearlyRevenueStats(year);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Dashboard data retrieved successFully!',
        data: result,
    });
});
exports.AdminController = {
    getAllArtistsFolders,
    // changeStatusOnFolder,
    getYearlyRevenueStats,
    getYearlyAppointmentStats,
    fetchDashboardPage,
    verifyArtistByAdmin,
    verifyBusinessByAdmin,
    fetchAllArtists,
    fetchAllBusinesses,
    fetchAllClients,
    fetchAllSecretReviews,
};

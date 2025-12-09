import httpStatus from 'http-status';
import { AppError, asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { AdminService } from './admin.service';

// 1. fetchDashboardPage
const fetchDashboardPage = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchDasboardPageData();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Dashboard data retrieved successFully!',
    data: result,
  });
});

// 2. getYearlyAppointmentStats
const getYearlyAppointmentStats = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year as string, 10);
  if (!year || isNaN(year)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'year query param required (e.g. 2025)'
    );
  }
  const result = await AdminService.getYearlyAppointmentStats(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Dashboard data retrieved successFully!',
    data: result,
  });
});

// 3. getYearlyRevenueStats
const getYearlyRevenueStats = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year as string, 10);
  if (!year || isNaN(year)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'year query param required (e.g. 2025)'
    );
  }

  const result = await AdminService.getYearlyRevenueStats(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Dashboard data retrieved successFully!',
    data: result,
  });
});

// 4. getAllArtistsFolders
const getAllArtistsFolders = asyncHandler(async (req, res) => {
  const result = await AdminService.getAllArtistsFoldersFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder retrieved successfully!',
    data: result,
  });
});

// 5. verifyArtistByAdmin
const verifyArtistByAdmin = asyncHandler(async (req, res) => {
  const artistId = req.params.artistId;
  const result = await AdminService.verifyArtistByAdminIntoDB(artistId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist verified successfully!',
    data: result,
  });
});

// 6. verifyBusinessByAdmin
const verifyBusinessByAdmin = asyncHandler(async (req, res) => {
  const businessId = req.params.businessId;
  const result = await AdminService.verifyBusinessByAdminIntoDB(businessId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business verified successfully!',
    data: result,
  });
});

// 7. getAllBookingsForAdmin
const getAllBookingsForAdmin = asyncHandler(async (req, res) => {
  const result = await AdminService.getAllBookingsForAdminIntoDb(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Bookings data retrieved successFully!',
    data: result,
  });
});

// fetchAllArtists
const fetchAllArtists = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllArtistsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artists retrieved successFully!',
    data: result.data,
    meta: result.meta,
  });
});

// fetchAllBusinesses
const fetchAllBusinesses = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllBusinessesFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business retrieved successFully!',
    data: result.data,
    meta: result.meta,
  });
});

// fetchAllClients
const fetchAllClients = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllClientsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Clients retrieved successFully!',
    data: result.data,
    meta: result.meta,
  });
});

// fetchAllSecretReviews
const fetchAllSecretReviews = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllSecretReviewsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Reviews retrieved successFully!',
    data: result.data,
    meta: result.meta,
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

export const AdminController = {
  fetchDashboardPage,
  getYearlyAppointmentStats,
  getYearlyRevenueStats,

  getAllArtistsFolders,
  verifyArtistByAdmin,
  verifyBusinessByAdmin,
  getAllBookingsForAdmin,
  // changeStatusOnFolder,
  fetchAllArtists,
  fetchAllBusinesses,
  fetchAllClients,
  fetchAllSecretReviews,
};

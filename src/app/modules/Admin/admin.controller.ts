import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { AdminService } from './admin.service';
import sendResponse from '../../utils/sendResponse';

// getAllArtistsFolders
const getAllArtistsFolders = asyncHandler(async (req, res) => {
  const result = await AdminService.getAllArtistsFoldersFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
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
const verifyArtistByAdmin = asyncHandler(async (req, res) => {
  const artistId = req.params.artistId;
  const result = await AdminService.verifyArtistByAdminIntoDB(artistId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist verified successfully!',
    data: result,
  });
});

// verifyBusinessByAdmin
const verifyBusinessByAdmin = asyncHandler(async (req, res) => {
  const businessId = req.params.businessId;
  const result = await AdminService.verifyBusinessByAdminIntoDB(businessId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business verified successfully!',
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

export const AdminController = {
  getAllArtistsFolders,
  // changeStatusOnFolder,
  verifyArtistByAdmin,
  verifyBusinessByAdmin,
  fetchAllArtists,
  fetchAllBusinesses,
  fetchAllClients,
  fetchAllSecretReviews,
};

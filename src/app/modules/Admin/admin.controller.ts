import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { AdminService } from './admin.service';
import sendResponse from '../../utils/sendResponse';

const getFolders = asyncHandler(async (req, res) => {
  const result = await AdminService.getArtistFolders();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Folder retrieved successfully!',
    data: result,
  });
});

const changeStatusOnFolder = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const permission = req.body.permission;
  const result = await AdminService.changeStatusOnFolder(id, permission);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Action is successful on folder!',
    data: result,
  });
});

const verifiedArtistByAdmin = asyncHandler(async (req, res) => {
  const artistId = req.params.artistId;
  const result = await AdminService.verifiedArtistByAdminIntoDB(artistId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist verified successfully!',
    data: result,
  });
});

const verifiedBusinessByAdmin = asyncHandler(async (req, res) => {
  const businessId = req.params.businessId;
  const result = await AdminService.verifiedBusinessByAdminIntoDB(businessId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business verified successfully!',
    data: result,
  });
});

const fetchAllArtists = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllArtists(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artists retrieved successFully!',
    data: result.data,
    meta: result.meta,
  });
});

const fetchAllBusiness = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllBusiness(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business retrieved successFully!',
    data: result.data,
    meta: result.meta,
  });
});

const fetchAllClient = asyncHandler(async (req, res) => {
  const result = await AdminService.fetchAllClient(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Clients retrieved successFully!',
    data: result.data,
    meta: result.meta,
  });
});

export const AdminController = {
  getFolders,
  changeStatusOnFolder,
  verifiedArtistByAdmin,
  verifiedBusinessByAdmin,
  fetchAllArtists,
  fetchAllBusiness,
  fetchAllClient,
};

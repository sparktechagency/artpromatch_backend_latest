import httpStatus from 'http-status';
import { AppError, asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { RequestService } from './request.service';

const createRequest = asyncHandler(async (req, res) => {
  const {artistId} = req.body
  const result = await RequestService.createRequestIntoDB(req.user, artistId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Request send successfully!',
    data: result,
  });
});

const fetchMyRequests = asyncHandler(async (req, res) => {
  const result = await RequestService.fetchMyRequest(req.user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});



const statusChangedByArtist = asyncHandler(async (req, res) => {
  const {status} = req.body;
  if(!['accepted','rejected'].includes(status)) throw new AppError(httpStatus.BAD_REQUEST,'status is required accepted or rejected')
  const result = await RequestService.statusChangedByArtistIntoDb(
    req.user,
    req.params.id,
    status
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests accepted successfully!',
    data: result,
  });
});


const addToJoinStudio = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if(!id) throw new AppError(httpStatus.BAD_REQUEST, "request id not found in params")
  const result = await RequestService.addToJoinStudioIntoDb(
    req.user,
    id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Join Artist successfully!',
    data: result,
  });
});


const removeRequest = asyncHandler(async (req, res) => {
  const result = await RequestService.removeRequest(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests removed successfully!',
    data: result,
  });
});

export const RequestController = {
  createRequest,
  fetchMyRequests,
  statusChangedByArtist,
  addToJoinStudio,
  removeRequest,
};

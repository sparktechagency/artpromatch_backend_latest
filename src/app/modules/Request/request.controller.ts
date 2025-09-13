import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { RequestService } from './request.service';

const createRequest = asyncHandler(async (req, res) => {
  const result = await RequestService.createRequestIntoDB(req.user, req.body);

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

const fetchIncomingRequests = asyncHandler(async (req, res) => {
  const result = await RequestService.fetchIncomingRequest(req.user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

const acceptRequestFromArtist = asyncHandler(async (req, res) => {
  const result = await RequestService.acceptRequestFromArtist(
    req.user,
    req.params.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests accepted successfully!',
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
  acceptRequestFromArtist,
  removeRequest,
  fetchIncomingRequests,
};

import httpStatus from 'http-status';
import { AppError, asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { RequestService } from './request.service';

// createRequest
const createRequest = asyncHandler(async (req, res) => {
  const { artistId } = req.body;
  const result = await RequestService.createRequestIntoDB(req.user, artistId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Request sent successfully!',
    data: result,
  });
});

// fetchAllMyRequests
const fetchAllMyRequests = asyncHandler(async (req, res) => {
  const result = await RequestService.fetchAllMyRequestsFromDB(
    req.user,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// artistAcceptRequest
const artistAcceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Request id not found in params!'
    );
  }

  const result = await RequestService.artistAcceptRequestIntoDb(
    req.user,
    requestId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests accepted successfully!',
    data: result,
  });
});

// artistRejectRequest
const artistRejectRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Request id not found in params!'
    );
  }

  const result = await RequestService.artistRejectRequestIntoDb(
    req.user,
    requestId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Requests rejected successfully!',
    data: result,
  });
});

// addToJoinStudio
const addToJoinStudio = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Request id not found in params!'
    );
  }

  const result = await RequestService.addToJoinStudioIntoDb(
    req.user,
    requestId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Join Artist successfully!',
    data: result,
  });
});

// removeRequest
// const removeRequest = asyncHandler(async (req, res) => {
//   const result = await RequestService.removeRequestFromDB(req.params.id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Requests removed successfully!',
//     data: result,
//   });
// });

export const RequestController = {
  createRequest,
  fetchAllMyRequests,
  artistAcceptRequest,
  artistRejectRequest,
  addToJoinStudio,
  // removeRequest,
};

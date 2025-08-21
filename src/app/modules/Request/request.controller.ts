import status from 'http-status';
import { AppResponse, asyncHandler } from '../../utils';
import { RequestService } from './request.service';

const createRequest = asyncHandler(async (req, res) => {
  const result = await RequestService.createRequestIntoDB(req.user, req.body);
  res
    .status(status.CREATED)
    .json(new AppResponse(status.CREATED, result, 'Request send successfully'));
});

const fetchPendingRequests = asyncHandler(async (req, res) => {
  const result = await RequestService.fetchRequestByArtist(req.user);

  // Send the response
  res
    .status(status.OK)
    .json(
      new AppResponse(status.OK, result, 'Requests retrieved successfully')
    );
});

const acceptRequestFromArtist = asyncHandler(async (req, res) => {
  const result = await RequestService.acceptRequestFromArtist(
    req.user,
    req.params.id
  );

  // Send the response
  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Requests accepted successfully'));
});

const removeRequest = asyncHandler(async (req, res) => {
  const result = await RequestService.removeRequest(req.params.id);

  // Send the response
  res
    .status(status.OK)
    .json(new AppResponse(status.OK, result, 'Requests removed successfully'));
});

export const RequestController = {
  createRequest,
  fetchPendingRequests,
  acceptRequestFromArtist,
  removeRequest,
};

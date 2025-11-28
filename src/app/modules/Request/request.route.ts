import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { RequestController } from './request.controller';
import { requestValidation } from './request.validation';

const router = Router();

// createRequest
router
  .route('/send')
  .post(
    auth(ROLE.BUSINESS),
    validateRequest(requestValidation.createRequestSchema),
    RequestController.createRequest
  );

// fetchAllMyRequests
router
  .route('/')
  .get(auth(ROLE.BUSINESS, ROLE.ARTIST), RequestController.fetchAllMyRequests);

// artistAcceptRequest
router
  .route('/accept/:requestId')
  .put(auth(ROLE.ARTIST), RequestController.artistAcceptRequest);

// artistRejectRequest
router
  .route('/reject/:requestId')
  .put(auth(ROLE.ARTIST), RequestController.artistRejectRequest);

// addToJoinStudio
router
  .route('/studio/:id')
  .put(auth(ROLE.BUSINESS), RequestController.addToJoinStudio);

export const RequestRoute = router;

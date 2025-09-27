import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { RequestController } from './request.controller';
import { requestValidation } from './request.validation';

const router = Router();

router
  .route('/send')
  .post(
    auth(ROLE.BUSINESS, ROLE.ARTIST),
    validateRequest(requestValidation.createRequestSchema),
    RequestController.createRequest
  );

router
  .route('/')
  .get(auth(ROLE.BUSINESS, ROLE.ARTIST), RequestController.fetchMyRequests);

router.route('/').get(auth(ROLE.ARTIST), RequestController.fetchMyRequests);

router
  .route('/:id')
  .put(auth(ROLE.ARTIST), RequestController.statusChangedByArtist)
  .put(auth(ROLE.BUSINESS), RequestController.addToJoinStudio);

router
  .route('/studio/:id')
  .put(auth(ROLE.BUSINESS), RequestController.addToJoinStudio);

export const RequestRoute = router;

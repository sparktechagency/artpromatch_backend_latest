import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { RequestController } from './request.controller';
import { requestValidation } from './request.validation';

const router = Router();

router
  .route('/send')
  .post(auth(ROLE.BUSINESS, ROLE.ARTIST), validateRequest(requestValidation.createRequestSchema) ,RequestController.createRequest);

router
  .route('/me')
  .get(
    auth(ROLE.BUSINESS, ROLE.ARTIST),
    RequestController.fetchMyRequests
  );

router
  .route('/incoming')
  .get(
    auth(ROLE.BUSINESS, ROLE.ARTIST),
    RequestController.fetchIncomingRequests
  );
  
router
  .route('/:id')
  .put(auth(ROLE.ARTIST), RequestController.acceptRequestFromArtist)
  .delete(auth(ROLE.ARTIST, ROLE.BUSINESS), RequestController.removeRequest);

export const RequestRoute = router;

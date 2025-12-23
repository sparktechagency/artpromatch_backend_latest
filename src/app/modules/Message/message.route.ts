import { Router } from 'express';
import { auth, validateRequestFromFormData } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { upload } from '../../lib';
import { MessageValidationSchema } from './message.validation';
import { MessageController } from './message.controller';

const router = Router();

router.post(
  '/new_message',
  auth(ROLE.ARTIST, ROLE.CLIENT, ROLE.BUSINESS),
  upload.fields([
    { name: 'imageUrl', maxCount: 10 },
    // { name: 'audioUrl', maxCount: 1 },
  ]),
  validateRequestFromFormData(MessageValidationSchema.messageSchema),
  MessageController.newMessage
);

router.patch(
  '/update_message_by_Id/:messageId',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  upload.fields([{ name: 'imageUrl', maxCount: 5 }]),
  validateRequestFromFormData(MessageValidationSchema.messageUpdateSchema),
  MessageController.updateMessageById
);

router.delete(
  '/delete_message/:messageId',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  MessageController.deleteMessageById
);

export const messageRoutes = router;

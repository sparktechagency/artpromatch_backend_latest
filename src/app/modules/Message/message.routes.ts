import express, { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { upload } from '../../lib';
import { AppError } from '../../utils';
import { validateRequestFromFormData } from '../../middlewares/validateRequest';
import MessageValidationSchema from '../Message/message.validation';
import MessageController from '../Message/message.controller';

const router = express.Router();

router.post(
  '/new_message',
  auth(ROLE.ARTIST, ROLE.CLIENT, ROLE.BUSINESS),
  upload.fields([
    { name: 'imageUrl', maxCount: 10 },
    { name: 'audioUrl', maxCount: 1 },
  ]),
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === 'string') {
        req.body = JSON.parse(req.body.data);
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Handle image uploads if they exist
      if (files?.imageUrl) {
        // Store paths of uploaded images
        req.body.imageUrl = files.imageUrl.map((file) =>
          file.path.replace(/\\/g, '/')
        );
      }

      if (files?.audioUrl && files.audioUrl.length > 0) {
        const audioPaths = files.audioUrl.map((file) =>
          file.path.replace(/\\/g, '/')
        );

        req.body.audioUrl =
          audioPaths.length === 1 ? audioPaths[0] : audioPaths;
      }

      next();
    } catch (error: unknown) {
      next(
        new AppError(
          httpStatus.BAD_REQUEST,
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  },
  validateRequestFromFormData(MessageValidationSchema.messageSchema),
  MessageController.new_message
);

router.patch(
  '/update_message_by_Id/:messageId',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  upload.fields([{ name: 'imageUrl', maxCount: 5 }]),
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === 'string') {
        req.body = JSON.parse(req.body.data);
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (files?.imageUrl) {
        req.body.imageUrl = files.imageUrl.map((file) =>
          file.path.replace(/\\/g, '/')
        );
      }

      next();
    } catch (error: unknown) {
      next(
        new AppError(
          httpStatus.BAD_REQUEST,
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  },
  validateRequest(MessageValidationSchema.messageUpdateSchema),
  MessageController.updateMessageById
);

router.delete(
  '/delete_message/:messageId',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  MessageController.deleteMessageById
);

const messageRoutes = router;

export default messageRoutes;

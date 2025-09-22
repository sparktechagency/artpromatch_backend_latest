
import express from 'express';

import notificationController from './notification.controller';
import { auth } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';

const notificationRouter = express.Router();

notificationRouter.get(
    '/get-notifications/:id',
    auth(ROLE.ARTIST,ROLE.CLIENT),
    notificationController.getNotifications
);
notificationRouter.patch(
    '/mark-notification',
    auth(ROLE.ARTIST,ROLE.CLIENT),
    notificationController.markAsSeen
);
notificationRouter.get(
    '/unseen-notification-count/:id',
     auth(ROLE.ARTIST,ROLE.CLIENT),
    notificationController.getUnseenNotificationCount
);

export default notificationRouter

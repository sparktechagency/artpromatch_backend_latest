
import express from 'express';

import notificationController from './notification.controller';
import { auth } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';

const notificationRoutes = express.Router();

notificationRoutes.get(
    '/me',
    auth(ROLE.ARTIST,ROLE.CLIENT),
    notificationController.getNotifications
);
notificationRoutes.patch(
    '/mark-notification',
    auth(ROLE.ARTIST,ROLE.CLIENT),
    notificationController.markAsSeen
);
notificationRoutes.get(
    '/unseen-notification-count/:id',
     auth(ROLE.ARTIST,ROLE.CLIENT),
    notificationController.getUnseenNotificationCount
);

export default notificationRoutes

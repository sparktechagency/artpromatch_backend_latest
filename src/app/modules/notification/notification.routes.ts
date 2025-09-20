
import express from 'express';
import authentication from '../../middlewares/auth.middleware';
import { ENUM_USER_ROLE } from '../../../enums/user-role';
import notificationController from './notification.controller';

const notificationRouter = express.Router();

notificationRouter.get(
    '/get-notifications/:id',
    authentication(ENUM_USER_ROLE.COOK,ENUM_USER_ROLE.RESTAURANT,ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN),
    notificationController.getNotifications
);
notificationRouter.patch(
    '/mark-notification',
    authentication(ENUM_USER_ROLE.COOK,ENUM_USER_ROLE.RESTAURANT,ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN),
    notificationController.markAsSeen
);
notificationRouter.get(
    '/unseen-notification-count/:id',
     authentication(ENUM_USER_ROLE.COOK,ENUM_USER_ROLE.RESTAURANT,ENUM_USER_ROLE.SUPER_ADMIN,ENUM_USER_ROLE.ADMIN),
    notificationController.getUnseenNotificationCount
);

export default notificationRouter

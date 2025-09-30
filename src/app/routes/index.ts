import { Router } from 'express';
import { AdminRoutes } from '../modules/admin/admin.route';
import { ArtistRoutes } from '../modules/artist/artist.routes';
import { AuthRoutes } from '../modules/auth/auth.route';
import { BookingRoutes } from '../modules/booking/booking.route';
import { BusinessRoutes } from '../modules/business/business.routes';
import { ClientRoutes } from '../modules/client/client.route';
import { FolderRoutes } from '../modules/folder/folder.route';
import { GuestSpotRoutes } from '../modules/guestSpot/guestSpot.route';
import { messageRoutes } from '../modules/message/message.route';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { RequestRoute } from '../modules/request/request.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/clients',
    route: ClientRoutes,
  },
  {
    path: '/artists',
    route: ArtistRoutes,
  },

  {
    path: '/business',
    route: BusinessRoutes,
  },
  {
    path: '/bookings',
    route: BookingRoutes,
  },
  {
    path: '/folders',
    route: FolderRoutes,
  },
  {
    path: '/requests',
    route: RequestRoute,
  },
  {
    path: '/messages',
    route: messageRoutes,
  },
  {
    path: '/notification',
    route: notificationRoutes,
  },
  {
    path: '/guestspots',
    route: GuestSpotRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

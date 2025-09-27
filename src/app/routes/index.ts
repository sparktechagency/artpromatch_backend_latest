import { Router } from 'express';
import { AdminRoutes } from '../modules/Admin/admin.route';
import { ArtistRoutes } from '../modules/Artist/artist.routes';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { BookingRoutes } from '../modules/Booking/booking.route';
import { BusinessRoutes } from '../modules/Business/business.routes';
import { ClientRoutes } from '../modules/Client/client.route';
import { FolderRoutes } from '../modules/Folder/folder.route';
import { GuestSpotRoutes } from '../modules/GuestSpot/guestSpot.route';
import { messageRoutes } from '../modules/Message/message.route';
import notificationRoutes from '../modules/Notification/notification.routes';
import { RequestRoute } from '../modules/Request/request.route';

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

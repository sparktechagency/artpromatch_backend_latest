"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("../modules/Auth/auth.route");
const client_route_1 = require("../modules/Client/client.route");
const artist_routes_1 = require("../modules/Artist/artist.routes");
const business_routes_1 = require("../modules/Business/business.routes");
const booking_route_1 = require("../modules/Booking/booking.route");
const folder_route_1 = require("../modules/Folder/folder.route");
const admin_route_1 = require("../modules/Admin/admin.route");
const request_route_1 = require("../modules/Request/request.route");
const guestSpot_route_1 = require("../modules/GuestSpot/guestSpot.route");
const message_routes_1 = __importDefault(require("../modules/Message/message.routes"));
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/admin',
        route: admin_route_1.AdminRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/clients',
        route: client_route_1.ClientRoutes,
    },
    {
        path: '/artists',
        route: artist_routes_1.ArtistRoutes,
    },
    {
        path: '/business',
        route: business_routes_1.BusinessRoutes,
    },
    {
        path: '/bookings',
        route: booking_route_1.BookingRoutes,
    },
    {
        path: '/folders',
        route: folder_route_1.FolderRoutes,
    },
    {
        path: '/requests',
        route: request_route_1.RequestRoute,
    },
    {
        path: '/messages',
        route: message_routes_1.default,
    },
    {
        path: '/guestspots',
        route: guestSpot_route_1.GuestSpotRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;

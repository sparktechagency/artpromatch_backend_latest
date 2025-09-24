"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestSpotService = void 0;
const utils_1 = require("../../utils");
const http_status_1 = __importDefault(require("http-status"));
const booking_model_1 = __importDefault(require("../Booking/booking.model"));
const guestSpot_model_1 = __importDefault(require("./guestSpot.model"));
const guestSpot_utils_1 = require("./guestSpot.utils");
const artist_model_1 = __importDefault(require("../Artist/artist.model"));
// createGuestSpotIntoDB
const createGuestSpotIntoDB = async (userData, payload) => {
    const artist = await artist_model_1.default.findOne({ auth: userData._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Your artist profile not found!');
    }
    const { currentLocation, startDate, endDate, startTime, endTime, offDays } = payload;
    const startTimeinMinute = (0, guestSpot_utils_1.convertTimeToMinutes)(startTime);
    const endTimeinMinute = (0, guestSpot_utils_1.convertTimeToMinutes)(endTime);
    // Check existing bookings in main location
    const existingBooking = await booking_model_1.default.findOne({
        artist: artist._id,
        isInGuestSpot: false, // means main location
        originalDate: { $gte: startDate, $lte: endDate },
        // $or: [
        //   {
        startTimeinMinute: { $lt: endTimeinMinute },
        endTimeinMinute: { $gt: startTimeinMinute },
        //   },
        // ],
    });
    if (existingBooking) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'You already have bookings in this date range at the main location!');
    }
    // Check if a guest spot already exists in this date range
    const existingGuestSpot = await guestSpot_model_1.default.findOne({
        artist: artist._id,
        // $or: [
        //   {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        //   },
        // ],
    });
    if (existingGuestSpot) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'GuestSpot already exists for these dates!');
    }
    const updatedArtist = await artist_model_1.default.findOneAndUpdate({ auth: userData._id }, {
        currentLocation: {
            // type: 'Point',
            coordinates: currentLocation.coordinates,
            currentLocationUntil: currentLocation.currentLocationUntil,
        },
    });
    if (!updatedArtist) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'Something happend wrong!');
    }
    // Create new GuestSpot
    const newGuestSpot = await guestSpot_model_1.default.create({
        artist: updatedArtist._id,
        startDate,
        endDate,
        startTime,
        endTime,
        startTimeinMinute,
        endTimeinMinute,
        offDays: offDays || null,
        isActive: true,
    });
    return newGuestSpot;
};
// updateGuestSpotIntoDB
const updateGuestSpotIntoDB = async (userData, guestSpotId, payload) => {
    const artist = await artist_model_1.default.findOne({ auth: userData._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Your artist profile not found!');
    }
    // checking if GuestSpot is available
    const existingSpot = await guestSpot_model_1.default.findOne({
        _id: guestSpotId,
        artist: artist._id,
    });
    if (!existingSpot) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'GuestSpot not found!');
    }
    if (existingSpot.endDate < new Date()) {
        throw new utils_1.AppError(http_status_1.default.FORBIDDEN, 'You cant update this old GuestSpot!');
    }
    const startDate = payload.startDate || existingSpot.startDate;
    const endDate = payload.endDate || existingSpot.endDate;
    const startTimeinMinute = payload.startTime
        ? (0, guestSpot_utils_1.convertTimeToMinutes)(payload.startTime)
        : existingSpot.startTimeinMinute;
    const endTimeinMinute = payload.endTime
        ? (0, guestSpot_utils_1.convertTimeToMinutes)(payload.endTime)
        : existingSpot.endTimeinMinute;
    // Check bookings in main location (isInGuestSpot: false)
    const bookingAtMain = await booking_model_1.default.findOne({
        artist: artist._id,
        isInGuestSpot: false,
        originalDate: { $gte: startDate, $lte: endDate },
        startTimeinMinute: { $lt: endTimeinMinute },
        endTimeinMinute: { $gt: startTimeinMinute },
    });
    if (bookingAtMain) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'You already have bookings in this date range at the main location!');
    }
    // Check bookings inside guest spots (isInGuestSpot: true)
    const bookingAtGuestSpot = await booking_model_1.default.findOne({
        artist: artist._id,
        isInGuestSpot: true,
        originalDate: { $gte: startDate, $lte: endDate },
        startTimeinMinute: { $lt: endTimeinMinute },
        endTimeinMinute: { $gt: startTimeinMinute },
    });
    if (bookingAtGuestSpot) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'You already have bookings in this date range at a GuestSpot!');
    }
    // Check overlap with other guest spots
    const overlappingSpot = await guestSpot_model_1.default.findOne({
        _id: { $ne: guestSpotId },
        artist: artist._id,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
    });
    if (overlappingSpot) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'Another GuestSpot already exists in this date range!');
    }
    const updatedArtist = await artist_model_1.default.findOneAndUpdate({ auth: userData._id }, {
        currentLocation: {
            // type: 'Point',
            coordinates: payload.currentLocation.coordinates,
            currentLocationUntil: payload.currentLocation.currentLocationUntil,
        },
    }, { new: true });
    if (!updatedArtist) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'Something happend wrong!');
    }
    const updatedSpot = await guestSpot_model_1.default.findByIdAndUpdate(guestSpotId, payload, {
        new: true,
    });
    return updatedSpot;
};
exports.GuestSpotService = {
    createGuestSpotIntoDB,
    updateGuestSpotIntoDB,
};

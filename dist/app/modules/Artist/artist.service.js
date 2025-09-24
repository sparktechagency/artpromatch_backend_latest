"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistService = exports.expireBoosts = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs_1 = __importDefault(require("fs"));
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const utils_1 = require("../../utils");
const artistPreferences_model_1 = __importDefault(require("../ArtistPreferences/artistPreferences.model"));
const auth_model_1 = require("../Auth/auth.model");
const schedule_utils_1 = require("../Schedule/schedule.utils");
const artist_model_1 = __importDefault(require("./artist.model"));
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../../config"));
const booking_model_1 = __importDefault(require("../Booking/booking.model"));
const boost_profile_model_1 = require("../BoostProfile/boost.profile.model");
const schedule_model_1 = __importDefault(require("../Schedule/schedule.model"));
const service_model_1 = __importDefault(require("../Service/service.model"));
const folder_utils_1 = require("../Folder/folder.utils");
const stripe = new stripe_1.default(config_1.default.stripe.stripe_secret_key);
// getAllArtistsFromDB
const getAllArtistsFromDB = async (query, userData) => {
    const loggedInArtist = await artist_model_1.default.findOne({ auth: userData._id });
    if (!loggedInArtist || !loggedInArtist.currentLocation) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Logged in artist location not found!');
    }
    const [lon, lat] = loggedInArtist.currentLocation.coordinates;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    // Filter artists with valid coordinates first, excluding logged-in artist
    // const artistsWithLocation = await Artist.find({
    //   'currentLocation.coordinates.0': { $exists: true },
    //   'currentLocation.coordinates.1': { $exists: true },
    //   auth: { $ne: userData._id }, // exclude logged-in artist
    // }).countDocuments();
    // searchFilter
    const searchFilter = {
        'currentLocation.coordinates.0': { $exists: true },
        'currentLocation.coordinates.1': { $exists: true },
        // auth: { $ne: userData._id }, // exclude logged-in artist
    };
    // Add searchTerm filter (on stringLocation OR expertise)
    if (query.searchTerm) {
        searchFilter.$or = [
            {
                stringLocation: {
                    $regex: query.searchTerm,
                    $options: 'i',
                },
            },
            {
                expertise: {
                    $elemMatch: { $regex: query.searchTerm, $options: 'i' },
                },
            },
        ];
    }
    // Geo query with pagination, excluding logged-in artist
    const artists = await artist_model_1.default.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lon, lat] },
                distanceField: 'distance', // distance in meters
                spherical: true,
                query: searchFilter, // nice to use
            },
        },
        {
            $lookup: {
                from: 'auths',
                localField: 'auth',
                foreignField: '_id',
                as: 'auth',
            },
        },
        { $unwind: '$auth' },
        {
            $project: {
                expertise: 1,
                currentLocation: 1,
                stringLocation: 1,
                distance: 1,
                avgRating: 1,
                hourlyRate: 1,
                totalCompletedService: 1,
                // Only these fields from auth
                'auth._id': 1,
                'auth.fullName': 1,
                'auth.phoneNumber': 1,
                'auth.email': 1,
                'auth.image': 1,
            },
        },
        { $skip: skip },
        { $limit: limit },
    ]);
    return {
        data: artists,
        meta: {
            total: artists.length,
            // total: artistsWithLocation,
            totalPage: Math.ceil(artists?.length / limit),
            // totalPage: Math.ceil(artistsWithLocation / limit),
            limit,
            page,
        },
    };
};
// getOwnArtistDataFromDB
const getOwnArtistDataFromDB = async (userData) => {
    const artist = await artist_model_1.default.findOne({ auth: userData._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    const services = await service_model_1.default.find({ artist: artist._id }).lean();
    return { artist, services };
};
// getSingleArtistFromDB
const getSingleArtistFromDB = async (artistId) => {
    const artist = await artist_model_1.default.findById(artistId);
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Logged in artist location not found!');
    }
    return artist;
};
// update artist person info into db
const updateArtistPersonalInfoIntoDB = async (user, payload) => {
    const artist = await artist_model_1.default.findOne({ auth: user._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    await artistPreferences_model_1.default.findOneAndUpdate({ artistId: artist._id }, payload, {
        new: true,
    });
    return await artist_model_1.default.findOneAndUpdate({ auth: user._id }, payload, {
        new: true,
    }).populate('preferences');
};
// updateArtistProfileIntoDB
const updateArtistProfileIntoDB = async (user, payload) => {
    const artist = await artist_model_1.default.findOne({ auth: user._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    const updatedArtist = await auth_model_1.Auth.findByIdAndUpdate(user._id, payload);
    if (!updatedArtist?.isModified) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update artist!');
    }
    const result = await artist_model_1.default.findOne({ auth: user._id })
        .select('_id')
        .populate({
        path: 'auth',
        select: 'fullName',
    });
    return result;
};
// updateArtistPreferencesIntoDB
const updateArtistPreferencesIntoDB = async (user, payload) => {
    const artist = await artist_model_1.default.findOne({
        auth: user._id,
    });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    const artistPreferences = await artistPreferences_model_1.default.findOne({
        artistId: artist._id,
    });
    if (!artistPreferences) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist preferences not found!');
    }
    Object.assign(artistPreferences, payload);
    await artistPreferences.save();
    return artistPreferences;
};
// updateArtistNotificationPreferencesIntoDB
const updateArtistNotificationPreferencesIntoDB = async (user, payload) => {
    const artist = await artist_model_1.default.findOne({
        auth: user._id,
    });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    const artistPreferences = await artistPreferences_model_1.default.findOne({
        artistId: artist._id,
    });
    if (!artistPreferences) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist preferences not found!');
    }
    Object.assign(artistPreferences, payload);
    await artistPreferences.save();
    return artistPreferences;
};
// updateArtistPrivacySecuritySettingsIntoDB
const updateArtistPrivacySecuritySettingsIntoDB = async (user, payload) => {
    const artist = await artist_model_1.default.findOne({
        auth: user._id,
    });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    const artistPreferences = await artistPreferences_model_1.default.findOne({
        artistId: artist._id,
    });
    if (!artistPreferences) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist preferences not found!');
    }
    Object.assign(artistPreferences, payload);
    await artistPreferences.save();
    return artistPreferences;
};
// updateArtistFlashesIntoDB
const updateArtistFlashesIntoDB = async (user, files) => {
    const artist = await artist_model_1.default.findOne({
        auth: user._id,
    });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    if (!files || !files?.length) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Files are required!');
    }
    return await artist_model_1.default.findByIdAndUpdate(artist._id, {
        $push: {
            flashes: { $each: files.map((file) => file.path.replace(/\\/g, '/')) },
        },
    }, { new: true });
};
// updateArtistPortfolioIntoDB
const updateArtistPortfolioIntoDB = async (user, files) => {
    const artist = await artist_model_1.default.findOne({
        auth: user._id,
    });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    // if (!artist.isVerifiedByOTP) {
    //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not verified');
    // }
    // if (!artist.isActive) {
    //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not activated by admin yet');
    // }
    if (!files || !files?.length) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Files are required');
    }
    return await artist_model_1.default.findByIdAndUpdate(artist._id, {
        $push: {
            portfolio: {
                $each: files.map((file) => file.path.replace(/\\/g, '/')),
            },
        },
    }, { new: true });
};
// addArtistServiceIntoDB
// const addArtistServiceIntoDB = async (
//   user: IAuth,
//   payload: TServicePayload,
//   files: TServiceImages
// ): Promise<IService> => {
//   const artist = await Artist.findOne({ auth: user._id });
//   if (!artist) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Artist not found!');
//   }
//   const thumbnail = files?.thumbnail[0]?.path.replace(/\\/g, '/') || '';
//   const images = files?.images?.map(
//     (image) => image.path.replace(/\\/g, '/') || ''
//   );
//   const totalDurationInMinutes = parseDurationToMinutes(payload.totalDuration);
//   const sessionInMinutes = parseDurationToMinutes(payload.sessionDuration);
//   const numberOfSessions = Math.ceil(totalDurationInMinutes / sessionInMinutes);
//   const serviceData = {
//     ...payload,
//     artist: artist._id,
//     totalDurationInMin: totalDurationInMinutes,
//     sessionDurationInMin: sessionInMinutes,
//     numberOfSessions: numberOfSessions,
//     thumbnail: thumbnail,
//     images: images,
//   };
//   const service = await Service.create(serviceData);
//   return service;
// };
// getServicesByArtistFromDB
const getServicesByArtistFromDB = async (user) => {
    const artist = await artist_model_1.default.findOne({ auth: user._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    const result = await service_model_1.default.aggregate([
        { $match: { artist: artist._id } },
        {
            $project: {
                avgRating: 1,
                bodyLocation: 1,
                description: 1,
                images: 1,
                price: 1,
                sessionType: 1,
                thumbnail: 1,
                title: 1,
                // totalCompletedOrder: 1,
                // totalReviewCount: 1,
                _id: 1,
            },
        },
    ]);
    return result;
};
// updateArtistServiceByIdIntoDB
const updateArtistServiceByIdIntoDB = async (id, payload, files, UserData) => {
    const artist = await artist_model_1.default.findOne({ auth: UserData._id });
    if (!artist) {
        (0, folder_utils_1.deleteSomeMulterFiles)([
            ...(files?.thumbnail || []),
            ...(files?.images || []),
        ]);
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Your artist account not found!');
    }
    const service = await service_model_1.default.findOne({ _id: id, artist: artist._id });
    if (!service) {
        (0, folder_utils_1.deleteSomeMulterFiles)([
            ...(files?.thumbnail || []),
            ...(files?.images || []),
        ]);
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Service not found!');
    }
    // Handle thumbnail
    let thumbnail = service.thumbnail;
    if (files?.thumbnail && files.thumbnail.length > 0) {
        thumbnail = files.thumbnail[0].path.replace(/\\/g, '/');
        (0, folder_utils_1.deleteSingleImage)(service.thumbnail);
    }
    // Handle images (merge old + new)
    let images = payload.images || service.images || [];
    if (files?.images && files.images.length > 0) {
        const newImages = files.images.map((img) => img.path.replace(/\\/g, '/'));
        images = [...images, ...newImages];
    }
    // Find removed images (present in old service.images but not in payload.images)
    const removedImages = service.images.filter((img) => !(payload.images || []).includes(img));
    // Delete removed images from storage
    if (removedImages.length > 0) {
        (0, folder_utils_1.deleteSomeImages)(removedImages);
    }
    // Validate images length (2-5)
    if (images.length < 2 || images.length > 5) {
        (0, folder_utils_1.deleteSomeMulterFiles)([
            ...(files?.thumbnail || []),
            ...(files?.images || []),
        ]);
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'You must upload between 2 and 5 Service Images!');
    }
    const serviceData = {
        ...payload,
        thumbnail,
        images,
    };
    const result = await service_model_1.default.findByIdAndUpdate(id, serviceData, {
        new: true,
    });
    if (!result) {
        (0, folder_utils_1.deleteSomeMulterFiles)([
            ...(files?.thumbnail || []),
            ...(files?.images || []),
        ]);
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Failed to update service!');
    }
    return result;
};
// deleteArtistServiceFromDB
const deleteArtistServiceFromDB = async (id, UserData) => {
    const artist = await artist_model_1.default.findOne({ auth: UserData._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Your artist account not found!');
    }
    const serviceExists = await service_model_1.default.find({ _id: id, artist: artist._id });
    if (!serviceExists) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Service not found!');
    }
    await service_model_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return null;
};
// removeImageFromDB
const removeImageFromDB = async (user, filePath) => {
    const artist = await artist_model_1.default.findOne({
        auth: user._id,
    });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    // Remove the image file path from the 'flashes' array
    const updatedArtist = await artist_model_1.default.findByIdAndUpdate(artist._id, {
        $pull: {
            flashes: filePath,
            portfolio: filePath,
        },
    }, { new: true });
    if (!updatedArtist) {
        throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to remove flash image');
    }
    // Check if the file exists and delete it
    fs_1.default.unlink(filePath, () => { });
    return updatedArtist;
};
// saveArtistAvailabilityIntoDB
const saveArtistAvailabilityIntoDB = async (user, payload) => {
    const { weeklySchedule: inputSchedule } = payload;
    const artist = await artist_model_1.default.findOne({ auth: user._id }).select('_id');
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    let schedule = await schedule_model_1.default.findOne({ artistId: artist._id });
    const normalizedSchedule = (0, schedule_utils_1.normalizeWeeklySchedule)(inputSchedule, schedule?.weeklySchedule);
    if (schedule) {
        schedule.weeklySchedule = normalizedSchedule;
    }
    else {
        schedule = new schedule_model_1.default({
            artistId: artist._id,
            weeklySchedule: normalizedSchedule,
        });
    }
    await schedule.save();
    const updatedSchedule = {};
    for (const day of Object.keys(inputSchedule)) {
        updatedSchedule[day] = (0, schedule_utils_1.formatDay)(schedule.weeklySchedule[day]);
    }
    return updatedSchedule;
};
// update time off
const setArtistTimeOffIntoDB = async (user, payload) => {
    const artist = await artist_model_1.default.findOne({ auth: user._id }).select('_id');
    if (!artist)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found');
    const { startDate, endDate } = payload;
    if (endDate <= startDate) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'End date must be after start date');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedule = await schedule_model_1.default.findOne({ _id: artist._id });
    if (!schedule)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist schedule not found');
    const existing = schedule.offDays;
    /**
     * Case 1: offDays already active (ongoing right now)
     */
    if (existing?.startDate &&
        existing.startDate < today &&
        existing.endDate &&
        today <= existing.endDate) {
        if (endDate <= existing.endDate) {
            throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'End date must extend current Off Days');
        }
        const hasBookings = await booking_model_1.default.exists({
            artist: artist._id,
            originalDate: { $gte: existing.endDate, $lt: endDate },
            status: { $in: ['pending', 'confirmed'] },
        });
        if (hasBookings) {
            throw new utils_1.AppError(http_status_1.default.CONFLICT, 'Cannot extend Off Days — bookings exist in new range');
        }
        schedule.offDays.endDate = endDate;
        await schedule.save();
        return schedule.offDays;
    }
    /**
     * Case 2: Old offDays expired — override if no conflicts
     */
    if (existing?.endDate && existing.endDate < today) {
        const hasBookings = await booking_model_1.default.exists({
            artist: artist._id,
            originalDate: { $gte: startDate, $lt: endDate },
            status: { $in: ['pending', 'confirmed'] },
        });
        if (hasBookings) {
            throw new utils_1.AppError(http_status_1.default.CONFLICT, 'Cannot override expired Off Days — bookings exist in new period');
        }
        schedule.offDays = { startDate, endDate };
        await schedule.save();
        return schedule.offDays;
    }
    /**
     * Case 3: New future offDays
     */
    if (startDate < today) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Start date cannot be in the past');
    }
    const hasBookings = await booking_model_1.default.exists({
        artist: artist._id,
        originalDate: { $gte: startDate, $lt: endDate },
        status: { $in: ['pending', 'confirmed'] },
    });
    if (hasBookings) {
        throw new utils_1.AppError(http_status_1.default.CONFLICT, 'Cannot set Off Days — bookings exist in this period');
    }
    schedule.offDays = { startDate, endDate };
    await schedule.save();
    return schedule.offDays;
};
const getArtistMonthlySchedule = async (user, year, month) => {
    // Month boundaries
    const artist = await artist_model_1.default.findOne({ auth: user.id }, '_id');
    if (!artist)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'artist not found');
    const startOfMonth = new Date(year, month - 1, 1); // 2025-05-01
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // 2025-05-31
    const result = await booking_model_1.default.aggregate([
        // 1. Filter artist bookings with valid status and sessions in month
        {
            $match: {
                artist: new mongoose_1.Types.ObjectId(artist._id),
                status: { $in: ['confirmed', 'in_progress', 'ready_for_completion'] },
                'sessions.date': { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        // 2. Only keep necessary fields
        {
            $project: {
                _id: 1,
                clientInfo: { fullName: 1, phone: 1, email: 1 },
                service: 1,
                sessions: 1,
            },
        },
        // 3. Unwind sessions
        { $unwind: '$sessions' },
        // 4. Match only sessions within month
        {
            $match: {
                'sessions.date': { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        // 5. Lookup service info
        {
            $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                pipeline: [{ $project: { _id: 1, title: 1 } }],
                as: 'service',
            },
        },
        { $unwind: '$service' },
        // 6. Project only needed fields per session
        {
            $project: {
                bookingId: '$_id',
                sessionId: '$sessions._id',
                date: '$sessions.date',
                startTime: '$sessions.startTime',
                endTime: '$sessions.endTime',
                status: '$sessions.status',
                service: { _id: '$service._id', name: '$service.title' },
                client: '$clientInfo',
            },
        },
        // 7. Group by day
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                sessions: { $push: '$$ROOT' },
            },
        },
        // 8. Sort by date
        { $sort: { _id: 1 } },
    ]);
    // Convert _id to date key
    const grouped = {};
    result.forEach((day) => {
        grouped[day._id] = day.sessions;
    });
    return grouped;
};
// createConnectedAccountAndOnboardingLinkForArtistIntoDb
const createConnectedAccountAndOnboardingLinkForArtistIntoDb = async (userData) => {
    try {
        // Step 1: Find Artist
        const artist = await artist_model_1.default.findOne({ auth: userData._id }, { _id: 1, stripeAccountId: 1, isStripeReady: 1, auth: 1 }).populate('auth');
        if (!artist) {
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found or restricted.');
        }
        // Step 2: If Stripe account exists but not ready yet
        if (artist.stripeAccountId && !artist.isStripeReady) {
            const account = await stripe.accounts.retrieve(artist.stripeAccountId);
            const isStripeFullyOk = account?.capabilities?.card_payments === 'active' &&
                account?.capabilities?.transfers === 'active';
            if (isStripeFullyOk) {
                // Mark artist as Stripe ready
                artist.isStripeReady = true;
                await artist.save();
                return null; // Already ready, no need for onboarding link
            }
            // Generate new onboarding link for existing account
            const onboardingData = await stripe.accountLinks.create({
                account: artist.stripeAccountId,
                refresh_url: `${config_1.default.stripe.onboarding_refresh_url}?accountId=${artist.stripeAccountId}`,
                return_url: config_1.default.stripe.onboarding_return_url,
                type: 'account_onboarding',
            });
            return onboardingData.url;
        }
        // Step 3: If no Stripe account, create a new one
        if (!artist.stripeAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                email: artist?.auth?.email,
                country: 'US',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
                settings: {
                    payouts: { schedule: { interval: 'manual' } },
                },
            });
            const onboardingData = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${config_1.default.stripe.onboarding_refresh_url}?accountId=${account.id}`,
                return_url: config_1.default.stripe.onboarding_return_url,
                type: 'account_onboarding',
            });
            const updatedArtist = await artist_model_1.default.findByIdAndUpdate(artist._id, { $set: { stripeAccountId: account.id, isStripeReady: false } }, { new: true });
            if (!updatedArtist) {
                await stripe.accounts.del(account.id); // cleanup
                throw new utils_1.AppError(http_status_1.default.NOT_EXTENDED, 'Failed to save Stripe account ID into DB!');
            }
            return onboardingData.url;
        }
        return null; // Fallback
    }
    catch (error) {
        utils_1.Logger.error('Stripe Onboarding Error:', error);
        throw new utils_1.AppError(http_status_1.default.SERVICE_UNAVAILABLE, 'Stripe onboarding service unavailable');
    }
};
// create service
const createService = async (user, payload, files) => {
    const artist = await artist_model_1.default.findOne({ auth: user._id });
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Artist not found!');
    }
    const thumbnail = files?.thumbnail[0]?.path.replace(/\\/g, '/') || '';
    const images = files?.images?.map((image) => image.path.replace(/\\/g, '/') || '') || [];
    // Validate images length (2-5)
    if (images.length < 2 || images.length > 5) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'You must upload between 2 and 5 Service Images!');
    }
    const serviceData = {
        ...payload,
        artist: artist._id,
        thumbnail,
        images,
    };
    const service = await service_model_1.default.create(serviceData);
    return service;
};
const boostProfileIntoDb = async (user) => {
    const session = await (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        const artist = await artist_model_1.default.findOne({ auth: user.id }, "_id boost").session(session);
        if (!artist)
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'artist not found');
        if (artist.boost.endTime && artist.boost.endTime > new Date())
            throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, "Artist already boost his profile");
        const boost = await boost_profile_model_1.ArtistBoost.create([
            {
                artist: artist._id,
                paymentStatus: 'pending',
                charge: Number(config_1.default.boost_charge),
                startTime: new Date(),
                endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
            },
        ], { session });
        // create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Profile Boost' },
                        unit_amount: Math.round(Number(config_1.default.boost_charge) * 100),
                    },
                    quantity: 1,
                },
            ],
            expand: ['payment_intent'],
            metadata: {
                boostId: boost[0]?._id?.toString(),
                artistId: artist._id.toString(),
            },
            success_url: `${process.env.CLIENT_URL}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/boost/cancel`,
        }, { idempotencyKey: `boost_${boost[0].id.toString()}` });
        // save boost record in DB (pending)
        boost[0].paymentStatus = 'succeeded';
        await boost[0].save({ session });
        await session.commitTransaction();
        session.endSession();
        return checkoutSession.url;
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
// expire boost
const expireBoosts = async () => {
    const now = new Date();
    // find boosts that are still active and past endTime
    const expiredBoosts = await boost_profile_model_1.ArtistBoost.find({
        endTime: { $lte: now },
        isActive: true,
    });
    if (expiredBoosts.length === 0)
        return; // nothing to do
    for (const boost of expiredBoosts) {
        boost.isActive = false;
        await boost.save();
        // update the artist's boost info
        await artist_model_1.default.findByIdAndUpdate(boost.artist, {
            'boost.isActive': false,
            'boost.endTime': boost.endTime,
        });
    }
};
exports.expireBoosts = expireBoosts;
// getServicesByArtistFromDB
// saveArtistAvailabilityIntoDB
// const saveArtistAvailabilityIntoDB = async (user: IAuth, payload: TAvailability) => {
//   const { day, slots } = payload;
//   // Step 1: Normalize into 1-hour blocks
//   const hourlySlots = slots.flatMap((slot) =>
//     splitIntoHourlySlots(slot.start, slot.end)
//   );
//   // Step 2: Deduplicate within request
//   const uniqueSlots = removeDuplicateSlots(hourlySlots);
//   // Step 3: Fetch existing slots for that day
//   const existing = await Slot.findOne({ auth: user._id, day });
//   if (existing) {
//     const existingSlots = existing.slots;
//     // Step 4: Check overlap
//     if (hasOverlap(existingSlots, uniqueSlots)) {
//       throw new AppError(
//         status.BAD_REQUEST,
//         'New slots overlap with existing slots'
//       );
//     }
//     // Step 5: Merge, dedupe, and sort
//     const merged = removeDuplicateSlots([
//       ...existingSlots,
//       ...uniqueSlots,
//     ]).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
//     // Step 6: Save
//     existing.set('slots', merged);
//     await existing.save();
//     return existing;
//   } else {
//     // First time adding slots
//     return await Slot.create({
//       auth: user._id,
//       day,
//       slots: uniqueSlots,
//     });
//   }
// };
exports.ArtistService = {
    getAllArtistsFromDB,
    getOwnArtistDataFromDB,
    getSingleArtistFromDB,
    updateArtistPersonalInfoIntoDB,
    updateArtistProfileIntoDB,
    updateArtistPreferencesIntoDB,
    updateArtistNotificationPreferencesIntoDB,
    updateArtistPrivacySecuritySettingsIntoDB,
    updateArtistFlashesIntoDB,
    updateArtistPortfolioIntoDB,
    getArtistMonthlySchedule,
    boostProfileIntoDb,
    // addArtistServiceIntoDB,
    getServicesByArtistFromDB,
    updateArtistServiceByIdIntoDB,
    deleteArtistServiceFromDB,
    removeImageFromDB,
    saveArtistAvailabilityIntoDB,
    setArtistTimeOffIntoDB,
    createConnectedAccountAndOnboardingLinkForArtistIntoDb,
    createService,
};

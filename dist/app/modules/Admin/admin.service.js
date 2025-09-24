"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = exports.getYearlyRevenueStats = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const folder_model_1 = __importDefault(require("../Folder/folder.model"));
const mongoose_query_builders_1 = __importDefault(require("mongoose-query-builders"));
const config_1 = __importDefault(require("../../config"));
const artist_model_1 = __importDefault(require("../Artist/artist.model"));
const booking_model_1 = __importDefault(require("../Booking/booking.model"));
const boost_profile_model_1 = require("../BoostProfile/boost.profile.model");
const business_model_1 = __importDefault(require("../Business/business.model"));
const client_model_1 = __importDefault(require("../Client/client.model"));
const secretReview_model_1 = __importDefault(require("../SecretReview/secretReview.model"));
const auth_model_1 = require("../Auth/auth.model");
// getAllArtistsFoldersFromDB
const getAllArtistsFoldersFromDB = async () => {
    return await folder_model_1.default.find();
};
// // changeStatusOnFolder
// const changeStatusOnFolder = async (folderId: string, permission: boolean) => {
//   const folder = await Folder.findById(folderId);
//   if (!folder) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
//   }
//   const artist = await Artist.findOne({ auth: folder.auth });
//   if (!artist) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
//   }
//   if (permission) {
//     if (folder.for === 'portfolio') {
//       await Artist.findByIdAndUpdate(artist?._id, {
//         $addToSet: {
//           portfolio: {
//             folder: folder._id,
//             position: artist?.portfolio?.length + 1,
//           },
//         },
//       });
//       return await Folder.findByIdAndUpdate(folderId, {
//         isPublished: true,
//       });
//     } else if (folder.for === 'flash') {
//       await Artist.findByIdAndUpdate(artist?._id, {
//         $addToSet: {
//           flashes: {
//             folder: folder._id,
//             position: artist?.flashes?.length + 1,
//           },
//         },
//       });
//       return await Folder.findByIdAndUpdate(folderId, {
//         isPublished: true,
//       });
//     }
//   } else {
//     const deletedFolder = await Folder.findByIdAndDelete(folderId);
//     deletedFolder?.images?.forEach((path) => fs.unlink(path, () => {}));
//   }
// };
// verifyArtistByAdminIntoDB
const verifyArtistByAdminIntoDB = async (artistId) => {
    const artist = await artist_model_1.default.findById(artistId).populate('auth');
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authDoc = artist.auth;
    authDoc.isActive = true;
    await authDoc.save();
    return null;
};
// verifyBusinessByAdminIntoDB
const verifyBusinessByAdminIntoDB = async (businessId) => {
    const result = await business_model_1.default.findByIdAndUpdate(businessId, { isActive: true }, { new: true });
    if (!result) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    return result;
};
// fetchAllArtistsFromDB
const fetchAllArtistsFromDB = async (query) => {
    const artistQuery = new mongoose_query_builders_1.default(artist_model_1.default.find().populate([
        {
            path: 'auth',
            select: 'fullName image email phoneNumber isProfile',
        },
    ]), query)
        .search(['type', 'expertise', 'city'])
        .filter()
        .sort()
        .sort()
        .paginate();
    const data = await artistQuery.modelQuery;
    const meta = await artistQuery.countTotal();
    return { data, meta };
};
// fetchAllBusinessesFromDB
const fetchAllBusinessesFromDB = async (query) => {
    const businessQuery = new mongoose_query_builders_1.default(business_model_1.default.find().populate([
        {
            path: 'auth',
            select: 'fullName image email phoneNumber isProfile',
        },
        {
            path: 'residentArtists',
            select: 'auth',
            populate: {
                path: 'auth',
                select: 'fullName image email phoneNumber isProfile',
            },
        },
    ]), query)
        .search([
        'city',
        'servicesOffered',
        'businessType',
        'studioName',
        'studioName',
    ])
        .filter()
        .sort()
        .sort()
        .paginate();
    const data = await businessQuery.modelQuery;
    const meta = await businessQuery.countTotal();
    return { data, meta };
};
// fetchAllClientsFromDB
const fetchAllClientsFromDB = async (query) => {
    const businessQuery = new mongoose_query_builders_1.default(client_model_1.default.find().populate([
        {
            path: 'auth',
            select: 'fullName image email phoneNumber isProfile',
        },
    ]), query)
        .search([
        'preferredArtistType',
        'favoritePiercing',
        'country',
        'favoriteTattoos',
        'lookingFor',
    ])
        .filter()
        .sort()
        .sort()
        .paginate();
    const data = await businessQuery.modelQuery;
    const meta = await businessQuery.countTotal();
    return { data, meta };
};
// fetchAllSecretReviewsFromDB
const fetchAllSecretReviewsFromDB = async (query) => {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = query;
    const pipeline = [
        // join service
        {
            $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'service',
            },
        },
        { $unwind: '$service' },
        // join artist
        {
            $lookup: {
                from: 'artists',
                localField: 'service.artist',
                foreignField: '_id',
                as: 'artist',
            },
        },
        { $unwind: '$artist' },
        // join auth
        {
            $lookup: {
                from: 'auths',
                localField: 'artist.auth',
                foreignField: '_id',
                as: 'auth',
            },
        },
        { $unwind: '$auth' },
        // join booking
        {
            $lookup: {
                from: 'bookings',
                localField: 'booking',
                foreignField: '_id',
                as: 'booking',
            },
        },
        { $unwind: '$booking' },
        // custom alias projection
        {
            $project: {
                description: 1,
                createdAt: 1,
                serviceTitle: '$service.title',
                servicePrice: '$service.price',
                serviceThumbnail: '$service.thumbnail',
                serviceAvgRating: '$service.avgRating',
                serviceTotalReviewCount: '$service.totalReviewCount',
                serviceTotalCompletedOrder: '$service.totalCompletedOrder',
                artistType: '$artist.type',
                artistExpertise: '$artist.expertise',
                artistCity: '$artist.city',
                artistEmail: '$auth.email',
                artistFullName: '$auth.fullName',
                artistPhone: '$auth.phoneNumber',
                artistImage: '$auth.image',
                bookingDate: '$booking.originalDate',
                bookingLocation: '$booking.serviceLocation',
                bookingBodyPart: '$booking.bodyPart',
                bookingPaymentStatus: '$booking.paymentStatus',
                bookingReview: '$booking.review',
                bookingRating: '$booking.rating',
            },
        },
    ];
    // Search across all fields
    if (searchTerm) {
        pipeline.push({
            $match: {
                $or: [
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { serviceTitle: { $regex: searchTerm, $options: 'i' } },
                    { artistEmail: { $regex: searchTerm, $options: 'i' } },
                    { artistPhone: { $regex: searchTerm, $options: 'i' } },
                    { bookingReview: { $regex: searchTerm, $options: 'i' } },
                    { bookingLocation: { $regex: searchTerm, $options: 'i' } },
                    { bookingBodyPart: { $regex: searchTerm, $options: 'i' } },
                ],
            },
        });
    }
    // Sorting
    pipeline.push({
        $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
    });
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    pipeline.push({ $skip: skip }, { $limit: Number(limit) });
    const data = await secretReview_model_1.default.aggregate(pipeline);
    // Count total (without pagination)
    const totalCountPipeline = [...pipeline];
    totalCountPipeline.splice(totalCountPipeline.findIndex((s) => '$skip' in s), 2); // remove skip + limit
    totalCountPipeline.push({ $count: 'total' });
    const totalResult = await secretReview_model_1.default.aggregate(totalCountPipeline);
    const total = totalResult[0]?.total || 0;
    const meta = {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPage: Math.ceil(total / Number(limit)),
    };
    return { data, meta };
};
const fetchDasboardPageData = async () => {
    const totalClients = await auth_model_1.Auth.countDocuments({ role: "CLIENT" });
    const totalArtists = await auth_model_1.Auth.countDocuments({ role: "ARTIST" });
    const totalBusinesses = await auth_model_1.Auth.countDocuments({ role: "BUSINESS" });
    const adminCommision = Number(config_1.default.admin_commision) / 100;
    const adminBookingIncomeAgg = await booking_model_1.default.aggregate([
        {
            $group: {
                _id: null,
                total: {
                    $sum: {
                        $multiply: [
                            { $subtract: ['$price', '$stripeFee'] }, // artist earnings
                            adminCommision, // 5% admin cut
                        ],
                    },
                },
            },
        },
    ]);
    // Admin income from boosts (assuming full amount goes to admin)
    const adminBoostIncomeAgg = await boost_profile_model_1.ArtistBoost.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: '$charge' },
            },
        },
    ]);
    const totalAdminIncome = (adminBookingIncomeAgg[0]?.total || 0) +
        (adminBoostIncomeAgg[0]?.total || 0);
    // ---- New Users (last 5) ----
    const rawUsers = await client_model_1.default.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
        path: 'auth',
        select: 'fullName email phoneNumber',
    });
    const newUsers = rawUsers.map((u) => ({
        _id: u._id,
        fullName: u.auth?.fullName || '',
        email: u.auth?.email || '',
        phone: u.auth?.phoneNumber || '',
    }));
    // ---- Top Artists (Example: by completed bookings count) ----
    const topArtists = await booking_model_1.default.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: '$artist',
                taskCompleted: { $sum: 1 },
            },
        },
        { $sort: { taskCompleted: -1 } },
        { $limit: 3 },
        {
            $lookup: {
                from: 'artists',
                localField: '_id',
                foreignField: '_id',
                as: 'artist',
            },
        },
        { $unwind: '$artist' },
        {
            $lookup: {
                from: 'auths',
                localField: 'artist.auth',
                foreignField: '_id',
                as: 'auth',
            },
        },
        { $unwind: '$auth' },
        {
            $project: {
                _id: 0,
                fullName: '$auth.fullName',
                type: '$artist.type',
            },
        },
    ]);
    return {
        stats: {
            totalClients,
            artists: totalArtists,
            businesses: totalBusinesses,
            earnings: totalAdminIncome,
        },
        newUsers,
        topArtists,
    };
};
const getYearlyAppointmentStats = async (year) => {
    const appointments = await booking_model_1.default.aggregate([
        {
            $project: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
            },
        },
        { $match: { year } },
        {
            $group: {
                _id: '$month',
                appointment: { $sum: 1 },
            },
        },
    ]);
    const result = [];
    for (let m = 1; m <= 12; m++) {
        const appt = appointments.find((a) => a._id === m);
        result.push({
            month: m,
            appointment: appt?.appointment || 0,
        });
    }
    return result;
};
// 2. Revenue grouped by year+month
const getYearlyRevenueStats = async (year) => {
    const adminCommision = Number(config_1.default.admin_commision) / 100;
    const bookingIncome = await booking_model_1.default.aggregate([
        {
            $project: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                adminIncome: {
                    $multiply: [{ $subtract: ['$price', '$stripeFee'] }, adminCommision],
                },
            },
        },
        { $match: { year } },
        {
            $group: {
                _id: '$month',
                earning: { $sum: '$adminIncome' },
            },
        },
    ]);
    // --- Boost income (full amount)
    const boostIncome = await boost_profile_model_1.ArtistBoost.aggregate([
        {
            $project: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                adminIncome: '$charge',
            },
        },
        { $match: { year } },
        {
            $group: {
                _id: '$month',
                earning: { $sum: '$adminIncome' },
            },
        },
    ]);
    // --- Merge both incomes month by month
    const result = [];
    for (let m = 1; m <= 12; m++) {
        const booking = bookingIncome.find((b) => b._id === m)?.earning || 0;
        const boost = boostIncome.find((b) => b._id === m)?.earning || 0;
        result.push({
            month: m,
            earning: booking + boost,
        });
    }
    return result;
};
exports.getYearlyRevenueStats = getYearlyRevenueStats;
exports.AdminService = {
    getAllArtistsFoldersFromDB,
    // changeStatusOnFolder,
    getYearlyRevenueStats: exports.getYearlyRevenueStats,
    getYearlyAppointmentStats,
    fetchDasboardPageData,
    verifyArtistByAdminIntoDB,
    verifyBusinessByAdminIntoDB,
    fetchAllArtistsFromDB,
    fetchAllBusinessesFromDB,
    fetchAllClientsFromDB,
    fetchAllSecretReviewsFromDB,
};

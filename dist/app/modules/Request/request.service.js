"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const artist_model_1 = __importDefault(require("../Artist/artist.model"));
const auth_constant_1 = require("../Auth/auth.constant");
const business_model_1 = __importDefault(require("../Business/business.model"));
const notification_constant_1 = require("../notification/notification.constant");
const notification_utils_1 = require("../notification/notification.utils");
const request_constant_1 = require("./request.constant");
const request_model_1 = __importDefault(require("./request.model"));
const createRequestIntoDB = async (user, artistId) => {
    // Artist send the request to business studios
    const business = await business_model_1.default.findOne({ auth: user._id }, '_id  totalArtistSpots studioName');
    const artist = await artist_model_1.default.findById(artistId).populate('auth');
    if (!artist)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'no authorize artist found!');
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'no authorize business found!');
    }
    const isExistRequest = await request_model_1.default.findOne({
        artistId,
        businessId: business._id,
        status: { $ne: 'rejected' },
    });
    if (isExistRequest) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Request already sent');
    }
    const requestPayload = {
        artistId: artistId,
        businessId: business._id,
        status: request_constant_1.REQUEST_STATUS.PENDING,
    };
    const result = await request_model_1.default.create(requestPayload);
    if (!result) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Failed To create Request');
    }
    const notificationPayload = {
        title: 'join studio request',
        message: `${business.studioName} request you to join their business studio`,
        receiver: artistId,
        type: notification_constant_1.NOTIFICATION_TYPE.JOIN_STUDIO_REQUEST,
    };
    (0, notification_utils_1.sendNotificationBySocket)(notificationPayload);
    return {
        requestId: result._id,
        artistName: artist.auth?.fullName,
        businessName: business.studioName,
        status: result.status,
    };
};
// fetch my request
const fetchMyRequest = async (user, query = {}) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const isArtist = user.role === auth_constant_1.ROLE.ARTIST;
    // find logged in user's ref (artistId or businessId)
    const myId = isArtist
        ? (await artist_model_1.default.findOne({ auth: user._id }).select('_id'))?._id
        : (await business_model_1.default.findOne({ auth: user._id }).select('_id'))?._id;
    if (!myId) {
        return {
            meta: { total: 0, totalPage: 0, page, limit },
            data: [],
        };
    }
    const match = isArtist ? { artistId: myId } : { businessId: myId };
    const pipeline = [
        { $match: match },
        ...(isArtist
            ? [
                // lookup business
                {
                    $lookup: {
                        from: 'businesses',
                        let: { businessId: '$businessId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$businessId'] } } },
                            {
                                $project: {
                                    _id: 1,
                                    studioName: 1,
                                    city: 1,
                                    auth: 1,
                                },
                            },
                        ],
                        as: 'businessInfo',
                    },
                },
                { $unwind: '$businessInfo' },
                // lookup auth for business (to get contact)
                {
                    $lookup: {
                        from: 'auths', // your Auth collection
                        localField: 'businessInfo.auth',
                        foreignField: '_id',
                        as: 'businessAuth',
                    },
                },
                { $unwind: '$businessAuth' },
            ]
            : [
                // lookup artist
                {
                    $lookup: {
                        from: 'artists',
                        let: { artistId: '$artistId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$artistId'] } } },
                            {
                                $project: {
                                    _id: 1,
                                    auth: 1,
                                    type: 1,
                                    city: 1,
                                },
                            },
                        ],
                        as: 'artistInfo',
                    },
                },
                { $unwind: '$artistInfo' },
                {
                    $lookup: {
                        from: 'auths',
                        localField: 'artistInfo.auth',
                        foreignField: '_id',
                        as: 'artistAuth',
                    },
                },
                { $unwind: '$artistAuth' },
            ]),
        // final projection
        {
            $project: isArtist
                ? {
                    _id: 1,
                    status: 1,
                    businessName: '$businessInfo.studioName',
                    city: '$businessInfo.city',
                    email: '$businessAuth.email',
                    phone: '$businessAuth.phoneNumber',
                }
                : {
                    _id: 1,
                    status: 1,
                    fullName: '$artistAuth.fullName',
                    city: '$artistInfo.city',
                    type: '$artistInfo.type',
                    email: '$artistAuth.email',
                    phone: '$artistAuth.phoneNumber',
                },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
    ];
    const data = await request_model_1.default.aggregate(pipeline);
    const total = await request_model_1.default.countDocuments(match);
    const totalPage = Math.ceil(total / limit);
    return {
        data,
        meta: { page, limit, total, totalPage },
    };
};
const statusChangedByArtistIntoDb = async (user, requestId, status) => {
    const artist = await artist_model_1.default.findOne({ auth: user._id }, 'business isConnBusiness');
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    if (artist.business && artist.isConnBusiness)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'you already joined another studio!');
    const request = await request_model_1.default.findOne({
        _id: requestId,
        artistId: artist._id,
    });
    if (!request) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Request not found!');
    }
    const business = await business_model_1.default.findById(request.businessId).select('totalArtistSpots filledArtistSpots');
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    const result = await request_model_1.default.findByIdAndUpdate(requestId, { $set: { status } }, { new: true });
    if (!result)
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'status not updated');
    return result;
};
const addToJoinStudioIntoDb = async (user, requestId) => {
    const request = await request_model_1.default.findOne({
        _id: requestId,
    });
    if (!request) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Request not found!');
    }
    const artist = await artist_model_1.default.findOne({ _id: request.artistId }, '_id');
    if (!artist) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    if (artist.business && artist.isConnBusiness)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'This artist already joined another studio!');
    if (request.status !== 'accepted')
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, "Artist don't accept you request");
    const business = await artist_model_1.default.findOne({ auth: user.id }, 'business isConnBusiness');
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    const result = await artist_model_1.default.findByIdAndUpdate(artist._id, { $set: { business: business._id, isConnBusiness: true } }, { new: true });
    if (!result)
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'status not updated');
    return request;
};
const removeRequest = async (requestId) => {
    return await request_model_1.default.findByIdAndDelete(requestId);
};
exports.RequestService = {
    createRequestIntoDB,
    fetchMyRequest,
    addToJoinStudioIntoDb,
    statusChangedByArtistIntoDb,
    removeRequest,
};

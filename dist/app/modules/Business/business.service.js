"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importStar(require("mongoose"));
const utils_1 = require("../../utils");
const artist_model_1 = __importDefault(require("../Artist/artist.model"));
const auth_model_1 = require("../Auth/auth.model");
const businessPreferences_model_1 = __importDefault(require("../BusinessPreferences/businessPreferences.model"));
const business_model_1 = __importDefault(require("./business.model"));
// Update Business Profile
const updateBusinessProfile = async (user, payload) => {
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        // Update Auth data with new business details
        await auth_model_1.Auth.findByIdAndUpdate(user._id, payload, { session });
        // Update Business data with new business details
        const updatedBusiness = await business_model_1.default.findOneAndUpdate({ auth: user._id }, {
            studioName: payload.studioName,
            businessType: payload.businessType,
            country: payload.country,
        }, { new: true, session }).populate([
            {
                path: 'auth',
                select: 'fullName email phoneNumber',
            },
        ]);
        await session.commitTransaction();
        await session.endSession();
        return updatedBusiness;
    }
    catch {
        await session.abortTransaction();
        await session.endSession();
        throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Something went wrong while updating business profile data');
    }
};
// Update Business Preferences
const updateBusinessPreferences = async (user, payload) => {
    // Find the business using the auth user_id
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    // Find and update business preferences, or create new ones if not found
    const preferences = await businessPreferences_model_1.default.findOneAndUpdate({ businessId: business._id }, payload, { new: true, upsert: true });
    if (!preferences) {
        throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Error updating business preferences');
    }
    return preferences;
};
// Update Business Notification Preferences
const updateBusinessNotificationPreferences = async (user, payload) => {
    // Step 1: Find the business
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    // Step 2: Find and update the business's notification preferences
    const preferences = await businessPreferences_model_1.default.findOneAndUpdate({ businessId: business._id }, payload, { new: true });
    if (!preferences) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Preferences not found for this business');
    }
    // Return the updated preferences
    return preferences;
};
// Update Business Security Settings
const updateBusinessSecuritySettings = async (user, payload) => {
    // Step 1: Find the business
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    // Step 2: Find and update the business's notification preferences
    const preferences = await businessPreferences_model_1.default.findOneAndUpdate({ businessId: business._id }, payload, { new: true });
    if (!preferences) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Preferences not found for this business');
    }
    // Return the updated preferences
    return preferences;
};
// updateGuestSpotsIntoDB
// const updateGuestSpotsIntoDB = async (user: IAuth, data: any) => {
//   // Find the business
//   const business = await Business.findOne({ auth: user._id });
//   if (!business) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
//   }
//   // Update guest spots logic
//   const guestSpots = data.guestSpots;
//   await business.save();
//   return business;
// };
// updateTimeOff
const updateTimeOff = async (user, data) => {
    // Handle time-off for business (if needed)
    // Assuming time-off is stored as blocked dates for a business
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Business not found!');
    }
    // Add the time-off logic
    business.timeOff.push(data.date);
    await business.save();
    return business;
};
const getBusinessArtists = async (user, query = {}) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business)
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'business not found');
    const pipeline = [
        {
            $match: {
                business: new mongoose_1.default.Types.ObjectId(business._id),
                isConnBusiness: true,
            },
        },
        // 🔹 Lookup artist auth info
        {
            $lookup: {
                from: 'auths',
                localField: 'auth',
                foreignField: '_id',
                as: 'artistAuth',
            },
        },
        { $unwind: '$artistAuth' },
        // 🔹 Lookup business info
        {
            $lookup: {
                from: 'businesses',
                localField: 'business',
                foreignField: '_id',
                as: 'businessInfo',
            },
        },
        { $unwind: '$businessInfo' },
        // 🔹 Final projection
        {
            $project: {
                _id: 1,
                fullName: '$artistAuth.fullName',
                email: '$artistAuth.email',
                phone: '$artistAuth.phone',
                city: 1,
                stringLocation: 1,
                avgRating: 1,
                portfolio: 1,
                flashes: 1,
            },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
    ];
    const data = await artist_model_1.default.aggregate(pipeline);
    // total count (without pagination)
    const total = await artist_model_1.default.countDocuments({
        business: business._id,
        isConnBusiness: true,
    });
    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
    };
};
// removeArtistFromDB
const removeArtistFromDB = async (user, artistId) => {
    const business = await business_model_1.default.findOne({ auth: user._id });
    if (!business) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Artist not found!');
    }
    return await business_model_1.default.findByIdAndUpdate(business._id, { $pull: { residentArtists: artistId } }, { new: true });
};
exports.BusinessService = {
    updateBusinessProfile,
    updateBusinessPreferences,
    updateBusinessNotificationPreferences,
    updateBusinessSecuritySettings,
    // updateGuestSpotsIntoDB,
    getBusinessArtists,
    updateTimeOff,
    removeArtistFromDB,
};

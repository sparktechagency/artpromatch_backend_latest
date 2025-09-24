"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs_1 = __importDefault(require("fs"));
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("../../config"));
const lib_1 = require("../../lib");
const utils_1 = require("../../utils");
const artist_model_1 = __importDefault(require("../Artist/artist.model"));
const artistPreferences_model_1 = __importDefault(require("../ArtistPreferences/artistPreferences.model"));
const business_model_1 = __importDefault(require("../Business/business.model"));
const businessPreferences_model_1 = __importDefault(require("../BusinessPreferences/businessPreferences.model"));
const client_model_1 = __importDefault(require("../Client/client.model"));
const clientPreferences_model_1 = __importDefault(require("../ClientPreferences/clientPreferences.model"));
const auth_constant_1 = require("./auth.constant");
const auth_model_1 = require("./auth.model");
const sendOtpSms_1 = __importDefault(require("../../utils/sendOtpSms"));
const auth_utils_1 = require("./auth.utils");
const OTP_EXPIRY_MINUTES = Number(config_1.default.otp_expiry_minutes);
// 1. createAuthIntoDB
const createAuthIntoDB = async (payload) => {
    // const existingUser = await Auth.findOne({ email: payload.email });
    const existingUser = await auth_model_1.Auth.isUserExistsByEmail(payload.email);
    // if user exists but unverified
    if (existingUser && !existingUser.isVerifiedByOTP) {
        const now = new Date();
        // if Token/OTP expired and sending new otp
        if (!existingUser.otpExpiry || existingUser.otpExpiry < now) {
            const otp = (0, lib_1.generateOtp)();
            await (0, sendOtpSms_1.default)(payload.phoneNumber, otp);
            existingUser.otp = otp;
            existingUser.otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
            existingUser.fcmToken = payload.fcmToken;
            await existingUser.save();
            throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'You have an unverified account, verify it with the new OTP sent to you!');
        }
        // if OTP is valid till now
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'You have an unverified account, verify it now with the otp sent to your phone!');
    }
    // if user is already verified
    if (existingUser && existingUser.isVerifiedByOTP) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'User already exists!');
    }
    //  OTP generating and sending if user is new
    const otp = (0, lib_1.generateOtp)();
    await (0, sendOtpSms_1.default)(payload.phoneNumber, otp);
    // Save new user as unverified
    const now = new Date();
    const newUser = await auth_model_1.Auth.create({
        ...payload,
        otp,
        otpExpiry: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000),
        isVerifiedByOTP: false,
    });
    // const token = jwt.sign({ ...payload, otp }, config.jwt.otp_secret!, {
    //   expiresIn: config.jwt.otp_secret_expires_in!,
    // } as SignOptions);
    return {
        userEmail: newUser.email,
        // token
    };
};
// 2. sendSignupOtpAgain
const sendSignupOtpAgain = async (userEmail) => {
    // const user = await Auth.findOne({ email: userEmail });
    const user = await auth_model_1.Auth.isUserExistsByEmail(userEmail);
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'You must sign up first to get an OTP!');
    }
    if (user.isVerifiedByOTP) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'This account is already verified!');
    }
    const now = new Date();
    // sending new OTP if previous one is expired
    if (!user.otpExpiry || user.otpExpiry < now) {
        const otp = (0, lib_1.generateOtp)();
        // send OTP via SMS
        await (0, sendOtpSms_1.default)(user.phoneNumber, otp);
        user.otp = otp;
        user.otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await user.save();
        // new token (optional, if needed to verify OTP from client side)
        // const newToken = jwt.sign(
        //   { email: user.email, phoneNumber: user.phoneNumber },
        //   config.jwt.otp_secret!,
        //   { expiresIn: config.jwt.otp_secret_expires_in! } as SignOptions
        // );
        return {
            userEmail: user.email,
            // token: newToken,
        };
    }
    // if OTP is still valid
    await (0, sendOtpSms_1.default)(user.phoneNumber, user.otp);
    throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'An OTP was already sent. Please wait until it expires before requesting a new one.');
};
// 3. verifySignupOtpIntoDB
const verifySignupOtpIntoDB = async (userEmail, otp) => {
    // const user = await Auth.findOne({ email: userEmail });
    const user = await auth_model_1.Auth.isUserExistsByEmail(userEmail);
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    if (user.isVerifiedByOTP) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'This account is already verified!');
    }
    // If OTP is invalid, throw error
    if (user?.otp !== otp) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid OTP!');
    }
    // Check if OTP is expired
    const now = new Date();
    if (!user.otpExpiry || user.otpExpiry < now) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'OTP has expired. Please request a new one!');
    }
    // Mark user as verified
    user.isVerifiedByOTP = true;
    await user.save();
    // Prepare user payload for tokens
    const userData = {
        id: user._id.toString(),
        email: user.email,
        phoneNumber: user.phoneNumber,
        stringLocation: '123 Main St, Springfield, IL',
        role: user.role,
        image: user?.image || auth_constant_1.defaultUserImage,
        fullName: user?.fullName,
    };
    // Generate access and refresh tokens
    const accessToken = (0, lib_1.createAccessToken)(userData);
    const refreshToken = (0, lib_1.createRefreshToken)(userData);
    // Return tokens to client
    return {
        // user: userData,
        accessToken,
        refreshToken,
    };
};
// 4. signinIntoDB
const signinIntoDB = async (payload) => {
    // const user = await Auth.findOne({ email: payload.email }).select('+password');
    const user = await auth_model_1.Auth.isUserExistsByEmail(payload.email);
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User does not exist!');
    }
    if (!user.isVerifiedByOTP) {
        const otp = (0, lib_1.generateOtp)();
        await (0, sendOtpSms_1.default)(user.phoneNumber, otp);
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await user.save();
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Verify your account with the new OTP in your phone!');
    }
    if (user.isSocialLogin) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'This account is registered via social login. Please sign in using your social account!');
    }
    // Validate password
    const isPasswordCorrect = await user.isPasswordMatched(payload.password);
    if (!isPasswordCorrect) {
        throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'Invalid credentials!');
    }
    user.fcmToken = payload.fcmToken;
    await user.save();
    let stringLocation = 'Not Set Yet';
    if (user.role === 'CLIENT') {
        const client = await client_model_1.default.findOne({ auth: user._id });
        stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'ARTIST') {
        const artist = await artist_model_1.default.findOne({ auth: user._id });
        stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'BUSINESS') {
        const business = await business_model_1.default.findOne({ auth: user._id });
        stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
    }
    // Prepare user data for tokens
    const userData = {
        id: user._id.toString(),
        fullName: user?.fullName,
        phoneNumber: user.phoneNumber,
        stringLocation: stringLocation,
        email: user.email,
        role: user.role,
        image: user?.image || auth_constant_1.defaultUserImage,
    };
    // Generate tokens
    const accessToken = (0, lib_1.createAccessToken)(userData);
    const refreshToken = (0, lib_1.createRefreshToken)(userData);
    // Return tokens and optionally user info
    return {
        // user: userData,
        accessToken,
        refreshToken,
    };
};
// 5. createProfileIntoDB
const createProfileIntoDB = async (payload, user, files) => {
    // Prevent creating multiple profiles for same user
    if (user.isProfile) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Your profile is already saved!');
    }
    // Destructure relevant fields from the payload
    const { role, mainLocation, radius, lookingFor, favoriteTattoos, notificationPreferences, artistType, expertise, studioName, city, businessType, servicesOffered, contactNumber, contactEmail, operatingHours, } = payload;
    // Extract file paths for ID verification images and business documents
    const idCardFront = files.idFrontPart?.[0]?.path.replace(/\\/g, '/') || '';
    const idCardBack = files.idBackPart?.[0]?.path.replace(/\\/g, '/') || '';
    const selfieWithId = files.selfieWithId?.[0]?.path.replace(/\\/g, '/') || '';
    // Business-specific file extractions
    const registrationCertificate = files.registrationCertificate?.[0]?.path.replace(/\\/g, '/') || '';
    const taxIdOrEquivalent = files.taxIdOrEquivalent?.[0]?.path.replace(/\\/g, '/') || '';
    const studioLicense = files.studioLicense?.[0]?.path.replace(/\\/g, '/') || '';
    // stringLocation
    const stringLocation = (0, auth_utils_1.getLocationName)(mainLocation?.coordinates);
    // Start a MongoDB session for transaction
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        // CLIENT PROFILE CREATION
        if (role === auth_constant_1.ROLE.CLIENT) {
            const isExistClient = await client_model_1.default.findOne({ auth: user._id });
            if (isExistClient) {
                throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Client data already saved in database');
            }
            const clientPayload = {
                auth: user._id,
                role,
                location: mainLocation,
                stringLocation,
                radius,
                lookingFor,
                favoriteTattoos,
            };
            const [client] = await client_model_1.default.create([clientPayload], { session });
            const clientPreferenceData = {
                clientId: client._id,
                notificationPreferences,
            };
            if (user?.isSocialLogin) {
                clientPreferenceData.connectedAccounts = [
                    {
                        provider: 'google',
                        connectedOn: user?.createdAt || new Date(),
                    },
                ];
            }
            await auth_model_1.Auth.findByIdAndUpdate(user._id, { role: auth_constant_1.ROLE.CLIENT, isProfile: true }, { session });
            await clientPreferences_model_1.default.create([clientPreferenceData], { session });
            await session.commitTransaction();
            await session.endSession();
            return client;
        }
        else if (role === auth_constant_1.ROLE.ARTIST) {
            // ARTIST PROFILE CREATION
            const isExistArtist = await artist_model_1.default.findOne({ auth: user._id });
            if (isExistArtist) {
                throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Artist profile already exists.');
            }
            const artistPayload = {
                auth: user._id,
                type: artistType,
                expertise,
                mainLocation,
                stringLocation,
                currentLocation: mainLocation,
                city,
                idCardFront,
                idCardBack,
                selfieWithId,
            };
            const [artist] = await artist_model_1.default.create([artistPayload], { session });
            const [artistPreferences] = await artistPreferences_model_1.default.create([{ artistId: artist._id }], { session });
            await auth_model_1.Auth.findByIdAndUpdate(user._id, { role: auth_constant_1.ROLE.ARTIST, isActive: false, isProfile: true }, { session });
            await artist_model_1.default.findByIdAndUpdate(artist._id, { preferences: artistPreferences._id }, { session });
            await session.commitTransaction();
            await session.endSession();
            return artist;
        }
        else if (role === auth_constant_1.ROLE.BUSINESS) {
            // BUSINESS PROFILE CREATION
            const isExistBusiness = await business_model_1.default.findOne({ auth: user._id });
            if (isExistBusiness) {
                throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Business profile already exists.');
            }
            const businessPayload = {
                auth: user._id,
                studioName,
                businessType,
                servicesOffered,
                location: mainLocation,
                stringLocation,
                city,
                contact: {
                    phone: contactNumber,
                    email: contactEmail,
                },
                operatingHours,
                registrationCertificate,
                taxIdOrEquivalent,
                studioLicense,
            };
            const [business] = await business_model_1.default.create([businessPayload], { session });
            const [businessPreferences] = await businessPreferences_model_1.default.create([{ businessId: business._id }], { session });
            await auth_model_1.Auth.findByIdAndUpdate(user._id, { role: auth_constant_1.ROLE.BUSINESS, isActive: false, isProfile: true }, { session });
            await business_model_1.default.findByIdAndUpdate(business._id, { preferences: businessPreferences._id }, { session });
            await session.commitTransaction();
            await session.endSession();
            return business;
        }
    }
    catch (error) {
        // ❌ Roll back transaction in case of any error
        await session.abortTransaction();
        await session.endSession();
        // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
        if (files && typeof files === 'object' && !Array.isArray(files)) {
            Object.values(files).forEach((fileArray) => {
                fileArray.forEach((file) => {
                    try {
                        if (file?.path && fs_1.default.existsSync(file.path)) {
                            fs_1.default.unlinkSync(file.path);
                        }
                    }
                    catch (deleteErr) {
                        // eslint-disable-next-line no-console
                        console.warn('Failed to delete uploaded file:', file.path, deleteErr);
                    }
                });
            });
        }
        // Re-throw application-specific errors
        if (error instanceof utils_1.AppError) {
            throw error;
        }
        // Throw generic internal server error
        throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, error?.message || 'Failed to create profile. Please try again.');
    }
};
// // clientCreateProfileIntoDB
// const clientCreateProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }
//   // Destructure relevant fields from the payload
//   const {
//     role,
//     location,
//     radius,
//     lookingFor,
//     favoriteTattoos,
//     notificationPreferences,
//   } = payload;
//   // Start a MongoDB session for transaction
//   const session = await startSession();
//   try {
//   session.startTransaction();
//     // CLIENT PROFILE CREATION
//     const isExistClient = await Client.findOne({ auth: user._id });
//     if (isExistClient) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Client data already saved in database'
//       );
//     }
//     const clientPayload = {
//       auth: user._id,
//       role,
//       location,
//       radius,
//       lookingFor,
//       favoriteTattoos,
//     };
//     const [client] = await Client.create([clientPayload], { session });
//     const clientPreferenceData: any = {
//       clientId: client._id,
//       notificationPreferences,
//     };
//     if (user?.isSocialLogin) {
//       clientPreferenceData.connectedAccounts = [
//         {
//           provider: 'google',
//           connectedOn: user?.createdAt || new Date(),
//         },
//       ];
//     }
//     await Auth.findByIdAndUpdate(
//       user._id,
//       { role: ROLE.CLIENT, isProfile: true },
//       { session }
//     );
//     await ClientPreferences.create([clientPreferenceData], { session });
//     await session.commitTransaction();
//     await session.endSession();
//     return client;
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();
//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }
//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };
// // artistCreateProfileIntoDB
// const artistCreateProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth,
//   files: TProfileFileFields
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }
//   // Destructure relevant fields from the payload
//   const { location, artistType, expertise, city } = payload;
//   // Extract file paths for ID verification images and business documents
//   const idCardFront = files.idFrontPart?.[0]?.path.replace(/\\/g, '/') || '';
//   const idCardBack = files.idBackPart?.[0]?.path.replace(/\\/g, '/') || '';
//   const selfieWithId = files.selfieWithId?.[0]?.path.replace(/\\/g, '/') || '';
//   // Start a MongoDB session for transaction
//   const session = await startSession();
//   try {
//   session.startTransaction();
//     // ARTIST PROFILE CREATION
//     const isExistArtist = await Artist.findOne({ auth: user._id });
//     if (isExistArtist) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Artist profile already exists.'
//       );
//     }
//     const artistPayload = {
//       auth: user._id,
//       type: artistType,
//       expertise,
//       location,
//       city,
//       idCardFront,
//       idCardBack,
//       selfieWithId,
//     };
//     const [artist] = await Artist.create([artistPayload], { session });
//     const [artistPreferences] = await ArtistPreferences.create(
//       [{ artistId: artist._id }],
//       { session }
//     );
//     await Auth.findByIdAndUpdate(
//       user._id,
//       { role: ROLE.ARTIST, isActive: false, isProfile: true },
//       { session }
//     );
//     await Artist.findByIdAndUpdate(
//       artist._id,
//       { preferences: artistPreferences._id },
//       { session }
//     );
//     await session.commitTransaction();
//     await session.endSession();
//     return artist;
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();
//     // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
//     if (files && typeof files === 'object' && !Array.isArray(files)) {
//       Object.values(files).forEach((fileArray) => {
//         fileArray.forEach((file) => {
//           try {
//             if (file?.path && fs.existsSync(file.path)) {
//               fs.unlinkSync(file.path);
//             }
//           } catch (deleteErr) {
//             // eslint-disable-next-line no-console
//             console.warn(
//               'Failed to delete uploaded file:',
//               file.path.replace(/\\/g, '/'),
//               deleteErr
//             );
//           }
//         });
//       });
//     }
//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }
//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };
// // businessCreateProfileIntoDB
// const businessCreateProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth,
//   files: TProfileFileFields
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }
//   // Destructure relevant fields from the payload
//   const {
//     location,
//     studioName,
//     city,
//     businessType,
//     servicesOffered,
//     contactNumber,
//     contactEmail,
//     operatingHours,
//   } = payload;
//   // Business-specific file extractions
//   const registrationCertificate =
//     files.registrationCertificate?.[0]?.path.replace(/\\/g, '/') || '';
//   const taxIdOrEquivalent = files.taxIdOrEquivalent?.[0]?.path.replace(/\\/g, '/') || '';
//   const studioLicense = files.studioLicense?.[0]?.path.replace(/\\/g, '/') || '';
//   // Start a MongoDB session for transaction
//   const session = await startSession();
//   try {
//   session.startTransaction();
//     // BUSINESS PROFILE CREATION
//     const isExistBusiness = await Business.findOne({ auth: user._id });
//     if (isExistBusiness) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Business profile already exists.'
//       );
//     }
//     const businessPayload = {
//       auth: user._id,
//       studioName,
//       businessType,
//       servicesOffered,
//       location,
//       city,
//       contact: {
//         phone: contactNumber,
//         email: contactEmail,
//       },
//       operatingHours,
//       registrationCertificate,
//       taxIdOrEquivalent,
//       studioLicense,
//     };
//     const [business] = await Business.create([businessPayload], { session });
//     const [businessPreferences] = await BusinessPreferences.create(
//       [{ businessId: business._id }],
//       { session }
//     );
//     await Auth.findByIdAndUpdate(
//       user._id,
//       { role: ROLE.BUSINESS, isActive: false, isProfile: true },
//       { session }
//     );
//     await Business.findByIdAndUpdate(
//       business._id,
//       { preferences: businessPreferences._id },
//       { session }
//     );
//     await session.commitTransaction();
//     await session.endSession();
//     return business;
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();
//     // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
//     if (files && typeof files === 'object' && !Array.isArray(files)) {
//       Object.values(files).forEach((fileArray) => {
//         fileArray.forEach((file) => {
//           try {
//             if (file?.path && fs.existsSync(file.path)) {
//               fs.unlinkSync(file.path);
//             }
//           } catch (deleteErr) {
//             // eslint-disable-next-line no-console
//             console.warn(
//               'Failed to delete uploaded file:',
//               file.path.replace(/\\/g, '/'),
//               deleteErr
//             );
//           }
//         });
//       });
//     }
//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }
//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };
// 6. socialLoginServices
const socialLoginServices = async (payload) => {
    const { email, fcmToken, image, fullName, phoneNumber, address } = payload;
    // Check if user exists
    // const user = await Auth.findOne({ email });
    const user = await auth_model_1.Auth.isUserExistsByEmail(email);
    if (!user) {
        const authRes = await auth_model_1.Auth.create({
            email,
            fcmToken,
            image,
            fullName,
            phoneNumber,
            address,
            isSocialLogin: true,
            isVerifiedByOTP: true,
        });
        if (!authRes) {
            throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create user into database!');
        }
        const userData = {
            id: authRes._id.toString(),
            email: authRes.email,
            phoneNumber: authRes.phoneNumber,
            stringLocation: '123 Main St, Springfield, IL',
            role: authRes.role,
            image: authRes?.image || auth_constant_1.defaultUserImage,
            fullName: authRes?.fullName,
        };
        const accessToken = (0, lib_1.createAccessToken)(userData);
        const refreshToken = (0, lib_1.createRefreshToken)(userData);
        // await Auth.findByIdAndUpdate(authRes._id, { refreshToken });
        return {
            response: {
                fullName: authRes.fullName,
                email: authRes.email,
                phoneNumber: authRes.phoneNumber,
                role: authRes.role,
                image: authRes.image,
                isProfile: authRes.isProfile,
            },
            accessToken,
            refreshToken,
        };
    }
    else {
        let stringLocation = 'Not Set Yet';
        if (user.role === 'CLIENT') {
            const client = await client_model_1.default.findOne({ auth: user._id });
            stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
        }
        if (user.role === 'ARTIST') {
            const artist = await artist_model_1.default.findOne({ auth: user._id });
            stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
        }
        if (user.role === 'BUSINESS') {
            const business = await business_model_1.default.findOne({ auth: user._id });
            stringLocation =
                business?.stringLocation || '123 Main St, Springfield, IL';
        }
        // Prepare user data for tokens
        const userData = {
            id: user._id.toString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
            stringLocation: stringLocation,
            role: user.role,
            image: user?.image || auth_constant_1.defaultUserImage,
            fullName: user?.fullName,
        };
        const accessToken = (0, lib_1.createAccessToken)(userData);
        const refreshToken = (0, lib_1.createRefreshToken)(userData);
        // user.refreshToken = refreshToken;
        user.fcmToken = fcmToken;
        await user.save({ validateBeforeSave: false });
        return {
            response: {
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                image: user.image,
                isProfile: user.isProfile,
            },
            accessToken,
            refreshToken,
        };
    }
};
// 7. updateProfilePhotoIntoDB
const updateProfilePhotoIntoDB = async (user, file) => {
    if (!file?.path) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'File is required!');
    }
    // Delete the previous image if exists
    if (user?.image) {
        try {
            await fs_1.default.promises.unlink(user.image);
        }
        catch (error) {
            utils_1.Logger.error('Error deleting old file:', error);
        }
    }
    const userNewData = await auth_model_1.Auth.findByIdAndUpdate(user._id, { image: file.path.replace(/\\/g, '/') }, { new: true }).select('fullName email image role isProfile phoneNumber');
    if (!userNewData) {
        await fs_1.default.promises.unlink(file?.path);
        throw new utils_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Something went wrong!');
    }
    let stringLocation = 'Not Set Yet';
    if (user.role === 'CLIENT') {
        const client = await client_model_1.default.findOne({ auth: user._id });
        stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'ARTIST') {
        const artist = await artist_model_1.default.findOne({ auth: user._id });
        stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'BUSINESS') {
        const business = await business_model_1.default.findOne({ auth: user._id });
        stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
    }
    // Prepare user data for tokens
    const jwtPayload = {
        id: userNewData._id.toString(),
        fullName: userNewData.fullName,
        phoneNumber: userNewData.phoneNumber,
        stringLocation: stringLocation,
        email: userNewData.email,
        image: userNewData.image || auth_constant_1.defaultUserImage,
        role: userNewData.role,
    };
    const accessToken = (0, lib_1.createAccessToken)(jwtPayload);
    return {
        accessToken,
    };
};
// 8. changePasswordIntoDB
const changePasswordIntoDB = async (payload, userData) => {
    const user = await auth_model_1.Auth.findOne({ _id: userData._id, isActive: true }).select('+password');
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not exists!');
    }
    const isCredentialsCorrect = await user.isPasswordMatched(payload.oldPassword);
    if (!isCredentialsCorrect) {
        throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'Current password is not correct!');
    }
    user.password = payload.newPassword;
    user.passwordChangedAt = new Date(Date.now() - 5000); // set 5 second before to avoid isJWTIssuedBeforePasswordChanged issue
    await user.save();
    let stringLocation = 'Not Set Yet';
    if (user.role === 'CLIENT') {
        const client = await client_model_1.default.findOne({ auth: user._id });
        stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'ARTIST') {
        const artist = await artist_model_1.default.findOne({ auth: user._id });
        stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'BUSINESS') {
        const business = await business_model_1.default.findOne({ auth: user._id });
        stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
    }
    // Prepare user data for tokens
    const jwtPayload = {
        id: user._id.toString(),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        stringLocation: stringLocation,
        email: user.email,
        image: user.image || auth_constant_1.defaultUserImage,
        role: user.role,
    };
    const accessToken = (0, lib_1.createAccessToken)(jwtPayload);
    const refreshToken = (0, lib_1.createRefreshToken)(jwtPayload);
    return {
        accessToken,
        refreshToken,
    };
};
// 9. forgotPassword
const forgotPassword = async (email) => {
    const user = await auth_model_1.Auth.findOne({ email, isActive: true });
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const now = new Date();
    // If OTP exists and not expired, reuse it
    if (user.otp && user.otpExpiry && now < user.otpExpiry) {
        // Do nothing, just reuse existing OTP
        const remainingMs = user.otpExpiry.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        // await sendOtpEmail(email, user.otp, user.fullName || 'Guest');
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, `Last OTP is valid till now, use that in ${remainingMinutes} minutes!`);
    }
    else {
        // Generate new OTP
        const otp = (0, lib_1.generateOtp)();
        const otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        // Send OTP
        await (0, utils_1.sendOtpEmail)(email, otp, user.fullName || 'Guest');
    }
    // Issue token (just with email)
    const token = jsonwebtoken_1.default.sign({ email }, config_1.default.jwt.otp_secret, {
        expiresIn: config_1.default.jwt.otp_secret_expires_in,
    });
    return { token };
};
// 10. verifyOtpForForgetPassword
const verifyOtpForForgetPassword = async (payload) => {
    const { email } = (0, lib_1.verifyToken)(payload.token, config_1.default.jwt.otp_secret);
    const user = await auth_model_1.Auth.findOne({ email, isActive: true });
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    // Check if OTP expired
    if (!user.otp || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
        // Generate and send new OTP
        const newOtp = (0, lib_1.generateOtp)();
        const newExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        user.otp = newOtp;
        user.otpExpiry = newExpiry;
        await user.save();
        await (0, utils_1.sendOtpEmail)(email, newOtp, user.fullName || 'Guest');
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'OTP expired. A new OTP has been sent!');
    }
    // Check if OTP matches
    if (user.otp !== payload.otp) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid OTP!');
    }
    // OTP verified → issue reset password token
    const resetPasswordToken = jsonwebtoken_1.default.sign({
        email: user.email,
        isResetPassword: true,
    }, config_1.default.jwt.otp_secret, { expiresIn: config_1.default.jwt.otp_secret_expires_in });
    return { resetPasswordToken };
};
// 11. resetPasswordIntoDB
const resetPasswordIntoDB = async (resetPasswordToken, newPassword) => {
    const payload = (0, lib_1.verifyToken)(resetPasswordToken, config_1.default.jwt.otp_secret);
    if (!payload?.isResetPassword) {
        throw new utils_1.AppError(http_status_1.default.FORBIDDEN, 'Invalid reset password token');
    }
    const user = await auth_model_1.Auth.findOne({ email: payload.email, isActive: true });
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: true });
    return null;
};
// 12. fetchProfileFromDB
const fetchProfileFromDB = async (user) => {
    if (user?.role === auth_constant_1.ROLE.CLIENT) {
        const client = await client_model_1.default.findOne({ auth: user._id }).populate([
            {
                path: 'auth',
                select: 'fullName image email phoneNumber isProfile',
            },
        ]);
        // .lean();
        const preference = await clientPreferences_model_1.default.findOne({
            clientId: client?._id,
        }).select('-clientId -updatedAt -createdAt');
        // .lean();
        // return { ...client, preference };
        return { ...client?.toObject(), preference };
    }
    else if (user?.role === auth_constant_1.ROLE.ARTIST) {
        const artist = await artist_model_1.default.findOne({ auth: user._id }).populate([
            {
                path: 'auth',
                select: 'fullName image email phoneNumber isProfile',
            },
            {
                path: 'flashes.folder',
            },
            {
                path: 'portfolio.folder',
            },
        ]);
        const preference = await artistPreferences_model_1.default.findOne({
            artistId: artist?._id,
        }).select('-artistId -updatedAt -createdAt');
        return { ...artist?.toObject(), preference };
    }
    else if (user?.role === auth_constant_1.ROLE.BUSINESS) {
        const business = await business_model_1.default.findOne({ auth: user._id }).populate([
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
        ]);
        const preference = await businessPreferences_model_1.default.findOne({
            businessId: business?._id,
        }).select('-businessId -updatedAt -createdAt');
        return { ...business?.toObject(), preference };
    }
    else if (user?.role === auth_constant_1.ROLE.ADMIN || user?.role === auth_constant_1.ROLE.SUPER_ADMIN) {
        return user;
    }
};
// 13. fetchAllConnectedAcount
const fetchAllConnectedAcount = async (user) => {
    let currentUser;
    if (user.role === auth_constant_1.ROLE.CLIENT) {
        currentUser = await client_model_1.default.findOne({ auth: user._id }).select('_id');
    }
    else if (user.role === auth_constant_1.ROLE.ARTIST) {
        currentUser = await artist_model_1.default.findOne({ auth: user._id }).select('_id');
    }
    else if (user.role === auth_constant_1.ROLE.BUSINESS) {
        currentUser = await business_model_1.default.findOne({ auth: user._id }).select('_id');
    }
    if (!currentUser) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'Profile not found!');
    }
    const result = await clientPreferences_model_1.default.findOne({ clientId: currentUser._id }, { connectedAccounts: 1, _id: 0 } // projection
    );
    return result;
};
// 14. deactivateUserAccountFromDB
const deactivateUserAccountFromDB = async (user, payload) => {
    const { email, password, deactivationReason } = payload;
    const currentUser = await auth_model_1.Auth.findOne({ _id: user._id, email: email });
    if (!currentUser)
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    const isPasswordCorrect = currentUser.isPasswordMatched(password);
    if (!isPasswordCorrect) {
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid credentials');
    }
    const result = await auth_model_1.Auth.findByIdAndUpdate(user._id, {
        $set: {
            isDeactivated: true,
            deactivationReason: deactivationReason,
            deactivatedAt: new Date(),
        },
    }, { new: true, select: 'email fullName isDeactivated deactivationReason' });
    return result;
};
// 15. deleteSpecificUserAccount
const deleteSpecificUserAccount = async (user) => {
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        const currentUser = await auth_model_1.Auth.findById(user._id).session(session);
        if (!currentUser)
            throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
        currentUser.isDeleted = true;
        currentUser.isDeactivated = false;
        currentUser.isProfile = false;
        if (user.role === auth_constant_1.ROLE.ARTIST || auth_constant_1.ROLE.BUSINESS) {
            currentUser.isActive = false;
        }
        if (currentUser.deactivationReason) {
            currentUser.deactivationReason = '';
        }
        await currentUser.save({ session });
        if (user.role === auth_constant_1.ROLE.CLIENT) {
            const client = await client_model_1.default.findOne({ auth: user._id })
                .select('_id')
                .session(session);
            if (client) {
                const result = await client_model_1.default.deleteOne({ _id: client._id }, { session });
                if (result.deletedCount === 0)
                    throw new Error('Client deletion failed!');
                const prefResult = await clientPreferences_model_1.default.deleteOne({ clientId: client._id }, { session });
                if (prefResult.deletedCount === 0)
                    throw new Error('Client deletion failed here!');
            }
        }
        else if (user.role === auth_constant_1.ROLE.ARTIST) {
            const artist = await artist_model_1.default.findOne({ auth: user._id })
                .select('_id')
                .session(session);
            if (artist) {
                const result = await artist_model_1.default.deleteOne({ _id: artist._id }, { session });
                if (result.deletedCount === 0)
                    throw new Error('Artist deletion failed!');
                const prefResult = await artistPreferences_model_1.default.deleteOne({ artistId: artist._id }, { session });
                if (prefResult.deletedCount === 0)
                    throw new Error('Artist deletion failed here!');
            }
        }
        else if (user.role === auth_constant_1.ROLE.BUSINESS) {
            const business = await business_model_1.default.findOne({ auth: user._id })
                .select('_id')
                .session(session);
            if (business) {
                const result = await businessPreferences_model_1.default.deleteOne({ businessId: business._id }, { session });
                if (result.deletedCount === 0)
                    throw new Error('Business deletion failed!');
                const prefResult = await business_model_1.default.deleteOne({ _id: business._id }, { session });
                if (prefResult.deletedCount === 0)
                    throw new Error('Business deletion failed here!');
            }
        }
        await session.commitTransaction();
        await session.endSession();
        return {
            email: currentUser.email,
            id: currentUser._id,
            fullName: currentUser.fullName,
        };
    }
    catch (error) {
        await session.abortTransaction();
        await session.endSession();
        throw error;
    }
};
// 16. getNewAccessTokenFromServer
const getNewAccessTokenFromServer = async (refreshToken) => {
    // checking if the given token is valid
    const decoded = (0, lib_1.verifyToken)(refreshToken, config_1.default.jwt.refresh_secret);
    const { email, iat } = decoded;
    // checking if the user is exist
    const user = await auth_model_1.Auth.isUserExistsByEmail(email);
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    // checking if the user is already deleted
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
        throw new utils_1.AppError(http_status_1.default.FORBIDDEN, 'This account is deleted!');
    }
    // checking if the any hacker using a token even-after the user changed the password
    if (user.passwordChangedAt &&
        user.isJWTIssuedBeforePasswordChanged(iat)) {
        throw new utils_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
    }
    let stringLocation = 'Not Set Yet';
    if (user.role === 'CLIENT') {
        const client = await client_model_1.default.findOne({ auth: user._id });
        stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'ARTIST') {
        const artist = await artist_model_1.default.findOne({ auth: user._id });
        stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'BUSINESS') {
        const business = await business_model_1.default.findOne({ auth: user._id });
        stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
    }
    // Prepare user data for tokens
    const jwtPayload = {
        id: user._id.toString(),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        stringLocation: stringLocation,
        email: user.email,
        image: user.image || auth_constant_1.defaultUserImage,
        role: user.role,
    };
    const accessToken = (0, lib_1.createAccessToken)(jwtPayload);
    return {
        accessToken,
    };
};
// 17. updateAuthDataIntoDB
const updateAuthDataIntoDB = async (payload, userData) => {
    const user = await auth_model_1.Auth.findByIdAndUpdate(userData._id, {
        fullName: payload.fullName,
    }, { new: true });
    if (!user) {
        throw new utils_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    let stringLocation = 'Not Set Yet';
    if (user.role === 'CLIENT') {
        const client = await client_model_1.default.findOne({ auth: user._id });
        stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'ARTIST') {
        const artist = await artist_model_1.default.findOne({ auth: user._id });
        stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
    }
    if (user.role === 'BUSINESS') {
        const business = await business_model_1.default.findOne({ auth: user._id });
        stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
    }
    // Prepare user data for tokens
    const jwtPayload = {
        id: user._id.toString(),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        stringLocation: stringLocation,
        email: user.email,
        image: user.image || auth_constant_1.defaultUserImage,
        role: user.role,
    };
    const accessToken = (0, lib_1.createAccessToken)(jwtPayload);
    return {
        accessToken,
    };
};
exports.AuthService = {
    createAuthIntoDB,
    sendSignupOtpAgain,
    verifySignupOtpIntoDB,
    signinIntoDB,
    createProfileIntoDB,
    // clientCreateProfileIntoDB,
    // artistCreateProfileIntoDB,
    // businessCreateProfileIntoDB,
    socialLoginServices,
    updateProfilePhotoIntoDB,
    changePasswordIntoDB,
    forgotPassword,
    verifyOtpForForgetPassword,
    resetPasswordIntoDB,
    fetchProfileFromDB,
    fetchAllConnectedAcount,
    deactivateUserAccountFromDB,
    deleteSpecificUserAccount,
    getNewAccessTokenFromServer,
    updateAuthDataIntoDB,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import httpStatus from 'http-status';
import jwt, { SignOptions } from 'jsonwebtoken';
import { startSession } from 'mongoose';
import { z } from 'zod';
import config from '../../config';
import {
  createAccessToken,
  createRefreshToken,
  generateOtp,
  verifyToken,
} from '../../lib';
import {
  TDeactiveAccountPayload,
  TProfileFileFields,
  TSocialLoginPayload,
} from '../../types';
import { AppError, Logger, sendOtpEmail } from '../../utils';
import Artist from '../Artist/artist.model';
import ArtistPreferences from '../ArtistPreferences/artistPreferences.model';
import Business from '../Business/business.model';
import BusinessPreferences from '../BusinessPreferences/businessPreferences.model';
import Client from '../Client/client.model';
import ClientPreferences from '../ClientPreferences/clientPreferences.model';
import { defaultUserImage, ROLE } from './auth.constant';
import { IAuth } from './auth.interface';
import { Auth } from './auth.model';
import { AuthValidation, TProfilePayload } from './auth.validation';
import sendOtpSms from '../../utils/sendOtpSms';
import { getLocationName } from './auth.utils';

const OTP_EXPIRY_MINUTES = Number(config.otp_expiry_minutes);

// 1. createAuthIntoDB
const createAuthIntoDB = async (payload: IAuth) => {
  // const existingUser = await Auth.findOne({ email: payload.email });
  const existingUser = await Auth.isUserExistsByEmail(payload.email);

  // if user exists but unverified
  if (existingUser && !existingUser.isVerifiedByOTP) {
    const now = new Date();

    // if Token/OTP expired and sending new otp
    if (!existingUser.otpExpiry || existingUser.otpExpiry < now) {
      const otp = generateOtp();
      await sendOtpSms(payload.phoneNumber, otp);

      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(
        now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
      );
      existingUser.fcmToken = payload.fcmToken;
      await existingUser.save();

      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have an unverified account, verify it with the new OTP sent to you!'
      );
    }

    // if OTP is valid till now
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You have an unverified account, verify it now with the otp sent to your phone!'
    );
  }

  // if user is already verified
  if (existingUser && existingUser.isVerifiedByOTP) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User already exists!');
  }

  //  OTP generating and sending if user is new
  const otp = generateOtp();
  await sendOtpSms(payload.phoneNumber, otp);

  // Save new user as unverified
  const now = new Date();
  const newUser = await Auth.create({
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
const sendSignupOtpAgain = async (userEmail: string) => {
  // const user = await Auth.findOne({ email: userEmail });
  const user = await Auth.isUserExistsByEmail(userEmail);

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You must sign up first to get an OTP!'
    );
  }

  if (user.isVerifiedByOTP) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This account is already verified!'
    );
  }

  const now = new Date();

  // sending new OTP if previous one is expired
  if (!user.otpExpiry || user.otpExpiry < now) {
    const otp = generateOtp();

    // send OTP via SMS
    await sendOtpSms(user.phoneNumber, otp);

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
  await sendOtpSms(user.phoneNumber, user.otp);
  throw new AppError(
    httpStatus.BAD_REQUEST,
    'An OTP was already sent. Please wait until it expires before requesting a new one.'
  );
};

// 3. verifySignupOtpIntoDB
const verifySignupOtpIntoDB = async (userEmail: string, otp: string) => {
  // const user = await Auth.findOne({ email: userEmail });
  const user = await Auth.isUserExistsByEmail(userEmail);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user.isVerifiedByOTP) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This account is already verified!'
    );
  }

  // If OTP is invalid, throw error
  if (user?.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP!');
  }

  // Check if OTP is expired
  const now = new Date();
  if (!user.otpExpiry || user.otpExpiry < now) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP has expired. Please request a new one!'
    );
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
    image: user?.image || defaultUserImage,
    fullName: user?.fullName,
  };

  // Generate access and refresh tokens
  const accessToken = createAccessToken(userData);
  const refreshToken = createRefreshToken(userData);

  // Return tokens to client
  return {
    // user: userData,
    accessToken,
    refreshToken,
  };
};

// 4. signinIntoDB
const signinIntoDB = async (payload: {
  email: string;
  password: string;
  fcmToken: string;
}) => {
  // const user = await Auth.findOne({ email: payload.email }).select('+password');
  const user = await Auth.isUserExistsByEmail(payload.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User does not exist!');
  }

  if (!user.isVerifiedByOTP) {
    const otp = generateOtp();
    await sendOtpSms(user.phoneNumber, otp);

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Verify your account with the new OTP in your phone!'
    );
  }

  if (user.isSocialLogin) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This account is registered via social login. Please sign in using your social account!'
    );
  }
  // Validate password
  const isPasswordCorrect = await user.isPasswordMatched(payload.password);

  if (!isPasswordCorrect) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials!');
  }

  user.fcmToken = payload.fcmToken;
  await user.save();

  let stringLocation: string = 'Not Set Yet';

  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'BUSINESS') {
    const business = await Business.findOne({ auth: user._id });
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
    image: user?.image || defaultUserImage,
  };

  // Generate tokens
  const accessToken = createAccessToken(userData);
  const refreshToken = createRefreshToken(userData);

  // Return tokens and optionally user info
  return {
    // user: userData,
    accessToken,
    refreshToken,
  };
};

// 5. createProfileIntoDB
const createProfileIntoDB = async (
  payload: TProfilePayload,
  user: IAuth,
  files: TProfileFileFields
) => {
  // Prevent creating multiple profiles for same user
  if (user.isProfile) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Your profile is already saved!'
    );
  }

  // Destructure relevant fields from the payload
  const {
    role,
    mainLocation,

    radius,
    lookingFor,
    favoriteTattoos,
    notificationPreferences,

    artistType,
    expertise,
    studioName,
    city,

    businessType,
    servicesOffered,
    contactNumber,
    contactEmail,
    operatingHours,
  } = payload;

  // Extract file paths for ID verification images and business documents
  const idCardFront = files.idFrontPart?.[0]?.path.replace(/\\/g, '/') || '';
  const idCardBack = files.idBackPart?.[0]?.path.replace(/\\/g, '/') || '';
  const selfieWithId = files.selfieWithId?.[0]?.path.replace(/\\/g, '/') || '';

  // Business-specific file extractions
  const registrationCertificate =
    files.registrationCertificate?.[0]?.path.replace(/\\/g, '/') || '';
  const taxIdOrEquivalent =
    files.taxIdOrEquivalent?.[0]?.path.replace(/\\/g, '/') || '';
  const studioLicense =
    files.studioLicense?.[0]?.path.replace(/\\/g, '/') || '';

  // stringLocation
  const stringLocation = getLocationName(mainLocation?.coordinates as number[]);

  // Start a MongoDB session for transaction
  const session = await startSession();

  try {
    session.startTransaction();

    // CLIENT PROFILE CREATION
    if (role === ROLE.CLIENT) {
      const isExistClient = await Client.findOne({ auth: user._id });
      if (isExistClient) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Client data already saved in database'
        );
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

      const [client] = await Client.create([clientPayload], { session });

      const clientPreferenceData: any = {
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

      await Auth.findByIdAndUpdate(
        user._id,
        { role: ROLE.CLIENT, isProfile: true },
        { session }
      );

      await ClientPreferences.create([clientPreferenceData], { session });

      await session.commitTransaction();
      await session.endSession();

      return client;
    } else if (role === ROLE.ARTIST) {
      // ARTIST PROFILE CREATION
      const isExistArtist = await Artist.findOne({ auth: user._id });
      if (isExistArtist) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Artist profile already exists.'
        );
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

      const [artist] = await Artist.create([artistPayload], { session });

      const [artistPreferences] = await ArtistPreferences.create(
        [{ artistId: artist._id }],
        { session }
      );

      await Auth.findByIdAndUpdate(
        user._id,
        { role: ROLE.ARTIST, isActive: false, isProfile: true },
        { session }
      );

      await Artist.findByIdAndUpdate(
        artist._id,
        { preferences: artistPreferences._id },
        { session }
      );

      await session.commitTransaction();
      await session.endSession();

      return artist;
    } else if (role === ROLE.BUSINESS) {
      // BUSINESS PROFILE CREATION
      const isExistBusiness = await Business.findOne({ auth: user._id });
      if (isExistBusiness) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Business profile already exists.'
        );
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

      const [business] = await Business.create([businessPayload], { session });

      const [businessPreferences] = await BusinessPreferences.create(
        [{ businessId: business._id }],
        { session }
      );

      await Auth.findByIdAndUpdate(
        user._id,
        { role: ROLE.BUSINESS, isActive: false, isProfile: true },
        { session }
      );

      await Business.findByIdAndUpdate(
        business._id,
        { preferences: businessPreferences._id },
        { session }
      );

      await session.commitTransaction();
      await session.endSession();

      return business;
    }
  } catch (error: any) {
    // ❌ Roll back transaction in case of any error
    await session.abortTransaction();
    await session.endSession();

    // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
    if (files && typeof files === 'object' && !Array.isArray(files)) {
      Object.values(files).forEach((fileArray) => {
        fileArray.forEach((file) => {
          try {
            if (file?.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (deleteErr) {
            // eslint-disable-next-line no-console
            console.warn(
              'Failed to delete uploaded file:',
              file.path,
              deleteErr
            );
          }
        });
      });
    }

    // Re-throw application-specific errors
    if (error instanceof AppError) {
      throw error;
    }

    // Throw generic internal server error
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error?.message || 'Failed to create profile. Please try again.'
    );
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
const socialLoginServices = async (payload: TSocialLoginPayload) => {
  const { email, fcmToken, image, fullName, phoneNumber, address } = payload;

  // Check if user exists
  // const user = await Auth.findOne({ email });
  const user = await Auth.isUserExistsByEmail(email);

  if (!user) {
    const authRes = await Auth.create({
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
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create user into database!'
      );
    }

    const userData = {
      id: authRes._id.toString(),
      email: authRes.email,
      phoneNumber: authRes.phoneNumber,
      stringLocation: '123 Main St, Springfield, IL',
      role: authRes.role,
      image: authRes?.image || defaultUserImage,
      fullName: authRes?.fullName,
    };

    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(userData);

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
  } else {
    let stringLocation: string = 'Not Set Yet';

    if (user.role === 'CLIENT') {
      const client = await Client.findOne({ auth: user._id });
      stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
    }

    if (user.role === 'ARTIST') {
      const artist = await Artist.findOne({ auth: user._id });
      stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
    }

    if (user.role === 'BUSINESS') {
      const business = await Business.findOne({ auth: user._id });
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
      image: user?.image || defaultUserImage,
      fullName: user?.fullName,
    };

    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(userData);

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
const updateProfilePhotoIntoDB = async (
  user: IAuth,
  file: Express.Multer.File | undefined
) => {
  if (!file?.path) {
    throw new AppError(httpStatus.BAD_REQUEST, 'File is required!');
  }

  // Delete the previous image if exists
  if (user?.image) {
    try {
      await fs.promises.unlink(user.image);
    } catch (error: unknown) {
      Logger.error('Error deleting old file:', error);
    }
  }

  const userNewData = await Auth.findByIdAndUpdate(
    user._id,
    { image: file.path.replace(/\\/g, '/') },
    { new: true }
  ).select('fullName email image role isProfile phoneNumber');

  if (!userNewData) {
    await fs.promises.unlink(file?.path);

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Something went wrong!'
    );
  }

  let stringLocation: string = 'Not Set Yet';

  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'BUSINESS') {
    const business = await Business.findOne({ auth: user._id });
    stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
  }

  // Prepare user data for tokens
  const jwtPayload = {
    id: userNewData._id.toString(),
    fullName: userNewData.fullName,
    phoneNumber: userNewData.phoneNumber,
    stringLocation: stringLocation,
    email: userNewData.email,
    image: userNewData.image || defaultUserImage,
    role: userNewData.role,
  };

  const accessToken = createAccessToken(jwtPayload);

  return {
    accessToken,
  };
};

// 8. changePasswordIntoDB
const changePasswordIntoDB = async (
  payload: z.infer<typeof AuthValidation.changePasswordSchema.shape.body>,
  userData: IAuth
) => {
  const user = await Auth.findOne({ _id: userData._id, isActive: true }).select(
    '+password'
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not exists!');
  }

  const isCredentialsCorrect = await user.isPasswordMatched(
    payload.oldPassword
  );

  if (!isCredentialsCorrect) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Current password is not correct!'
    );
  }

  user.password = payload.newPassword;
  user.passwordChangedAt = new Date(Date.now() - 5000); // set 5 second before to avoid isJWTIssuedBeforePasswordChanged issue

  await user.save();

  let stringLocation: string = 'Not Set Yet';

  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'BUSINESS') {
    const business = await Business.findOne({ auth: user._id });
    stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
  }

  // Prepare user data for tokens
  const jwtPayload = {
    id: user._id.toString(),
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    stringLocation: stringLocation,
    email: user.email,
    image: user.image || defaultUserImage,
    role: user.role,
  };

  const accessToken = createAccessToken(jwtPayload);
  const refreshToken = createRefreshToken(jwtPayload);

  return {
    accessToken,
    refreshToken,
  };
};

// 9. forgotPassword
const forgotPassword = async (email: string) => {
  const user = await Auth.findOne({ email, isActive: true });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const now = new Date();

  // If OTP exists and not expired, reuse it
  if (user.otp && user.otpExpiry && now < user.otpExpiry) {
    // Do nothing, just reuse existing OTP
    const remainingMs = user.otpExpiry.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    // await sendOtpEmail(email, user.otp, user.fullName || 'Guest');

    throw new AppError(
      httpStatus.NOT_FOUND,
      `Last OTP is valid till now, use that in ${remainingMinutes} minutes!`
    );
  } else {
    // Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP
    await sendOtpEmail(email, otp, user.fullName || 'Guest');
  }

  // Issue token (just with email)
  const token = jwt.sign({ email }, config.jwt.otp_secret!, {
    expiresIn: config.jwt.otp_secret_expires_in!,
  } as SignOptions);

  return { token };
};

// 10. verifyOtpForForgetPassword
const verifyOtpForForgetPassword = async (payload: {
  token: string;
  otp: string;
}) => {
  const { email } = verifyToken(payload.token, config.jwt.otp_secret!) as any;

  const user = await Auth.findOne({ email, isActive: true });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Check if OTP expired
  if (!user.otp || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
    // Generate and send new OTP
    const newOtp = generateOtp();
    const newExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otp = newOtp;
    user.otpExpiry = newExpiry;
    await user.save();

    await sendOtpEmail(email, newOtp, user.fullName || 'Guest');

    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP expired. A new OTP has been sent!'
    );
  }

  // Check if OTP matches
  if (user.otp !== payload.otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP!');
  }

  // OTP verified → issue reset password token
  const resetPasswordToken = jwt.sign(
    {
      email: user.email,
      isResetPassword: true,
    },
    config.jwt.otp_secret!,
    { expiresIn: config.jwt.otp_secret_expires_in! } as SignOptions
  );

  return { resetPasswordToken };
};

// 11. resetPasswordIntoDB
const resetPasswordIntoDB = async (
  resetPasswordToken: string,
  newPassword: string
) => {
  const payload = verifyToken(resetPasswordToken, config.jwt.otp_secret!) as {
    email: string;
    isResetPassword?: boolean;
  };

  if (!payload?.isResetPassword) {
    throw new AppError(httpStatus.FORBIDDEN, 'Invalid reset password token');
  }

  const user = await Auth.findOne({ email: payload.email, isActive: true });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return null;
};

// 12. fetchProfileFromDB
const fetchProfileFromDB = async (user: IAuth) => {
  if (user?.role === ROLE.CLIENT) {
    const client = await Client.findOne({ auth: user._id }).populate([
      {
        path: 'auth',
        select: 'fullName image email phoneNumber isProfile',
      },
    ]);
    // .lean();

    const preference = await ClientPreferences.findOne({
      clientId: client?._id,
    }).select('-clientId -updatedAt -createdAt');
    // .lean();

    // return { ...client, preference };
    return { ...client?.toObject(), preference };
  } else if (user?.role === ROLE.ARTIST) {
    const artist = await Artist.findOne({ auth: user._id }).populate([
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

    const preference = await ArtistPreferences.findOne({
      artistId: artist?._id,
    }).select('-artistId -updatedAt -createdAt');

    return { ...artist?.toObject(), preference };
  } else if (user?.role === ROLE.BUSINESS) {
    const business = await Business.findOne({ auth: user._id }).populate([
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

    const preference = await BusinessPreferences.findOne({
      businessId: business?._id,
    }).select('-businessId -updatedAt -createdAt');

    return { ...business?.toObject(), preference };
  } else if (user?.role === ROLE.ADMIN || user?.role === ROLE.SUPER_ADMIN) {
    return user;
  }
};

// 13. fetchAllConnectedAcount
const fetchAllConnectedAcount = async (user: IAuth) => {
  let currentUser;

  if (user.role === ROLE.CLIENT) {
    currentUser = await Client.findOne({ auth: user._id }).select('_id');
  } else if (user.role === ROLE.ARTIST) {
    currentUser = await Artist.findOne({ auth: user._id }).select('_id');
  } else if (user.role === ROLE.BUSINESS) {
    currentUser = await Business.findOne({ auth: user._id }).select('_id');
  }

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'Profile not found!');
  }

  const result = await ClientPreferences.findOne(
    { clientId: currentUser._id },
    { connectedAccounts: 1, _id: 0 } // projection
  );

  return result;
};

// 14. deactivateUserAccountFromDB
const deactivateUserAccountFromDB = async (
  user: IAuth,
  payload: TDeactiveAccountPayload
) => {
  const { email, password, deactivationReason } = payload;

  const currentUser = await Auth.findOne({ _id: user._id, email: email });

  if (!currentUser) throw new AppError(httpStatus.NOT_FOUND, 'User not found!');

  const isPasswordCorrect = currentUser.isPasswordMatched(password);

  if (!isPasswordCorrect) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }

  const result = await Auth.findByIdAndUpdate(
    user._id,
    {
      $set: {
        isDeactivated: true,
        deactivationReason: deactivationReason,
        deactivatedAt: new Date(),
      },
    },
    { new: true, select: 'email fullName isDeactivated deactivationReason' }
  );

  return result;
};

// 15. deleteSpecificUserAccount
const deleteSpecificUserAccount = async (user: IAuth) => {
  const session = await startSession();

  try {
    session.startTransaction();

    const currentUser = await Auth.findById(user._id).session(session);
    if (!currentUser)
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');

    currentUser.isDeleted = true;
    currentUser.isDeactivated = false;
    currentUser.isProfile = false;

    if (user.role === ROLE.ARTIST || ROLE.BUSINESS) {
      currentUser.isActive = false;
    }
    if (currentUser.deactivationReason) {
      currentUser.deactivationReason = '';
    }
    await currentUser.save({ session });

    if (user.role === ROLE.CLIENT) {
      const client = await Client.findOne({ auth: user._id })
        .select('_id')
        .session(session);

      if (client) {
        const result = await Client.deleteOne({ _id: client._id }, { session });
        if (result.deletedCount === 0)
          throw new Error('Client deletion failed!');

        const prefResult = await ClientPreferences.deleteOne(
          { clientId: client._id },
          { session }
        );
        if (prefResult.deletedCount === 0)
          throw new Error('Client deletion failed here!');
      }
    } else if (user.role === ROLE.ARTIST) {
      const artist = await Artist.findOne({ auth: user._id })
        .select('_id')
        .session(session);

      if (artist) {
        const result = await Artist.deleteOne({ _id: artist._id }, { session });
        if (result.deletedCount === 0)
          throw new Error('Artist deletion failed!');
        const prefResult = await ArtistPreferences.deleteOne(
          { artistId: artist._id },
          { session }
        );
        if (prefResult.deletedCount === 0)
          throw new Error('Artist deletion failed here!');
      }
    } else if (user.role === ROLE.BUSINESS) {
      const business = await Business.findOne({ auth: user._id })
        .select('_id')
        .session(session);

      if (business) {
        const result = await BusinessPreferences.deleteOne(
          { businessId: business._id },
          { session }
        );
        if (result.deletedCount === 0)
          throw new Error('Business deletion failed!');
        const prefResult = await Business.deleteOne(
          { _id: business._id },
          { session }
        );
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
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

// 16. getNewAccessTokenFromServer
const getNewAccessTokenFromServer = async (refreshToken: string) => {
  // checking if the given token is valid
  const decoded = verifyToken(refreshToken, config.jwt.refresh_secret!) as any;

  const { email, iat } = decoded;

  // checking if the user is exist
  const user = await Auth.isUserExistsByEmail(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // checking if the user is already deleted
  const isDeleted = user?.isDeleted;
  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This account is deleted!');
  }

  // checking if the any hacker using a token even-after the user changed the password
  if (
    user.passwordChangedAt &&
    user.isJWTIssuedBeforePasswordChanged(iat as number)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
  }

  let stringLocation: string = 'Not Set Yet';

  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'BUSINESS') {
    const business = await Business.findOne({ auth: user._id });
    stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
  }

  // Prepare user data for tokens
  const jwtPayload = {
    id: user._id.toString(),
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    stringLocation: stringLocation,
    email: user.email,
    image: user.image || defaultUserImage,
    role: user.role,
  };

  const accessToken = createAccessToken(jwtPayload);

  return {
    accessToken,
  };
};

// 17. updateAuthDataIntoDB
const updateAuthDataIntoDB = async (
  payload: { fullName: string },
  userData: IAuth
) => {
  const user = await Auth.findByIdAndUpdate(
    userData._id,
    {
      fullName: payload.fullName,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  let stringLocation: string = 'Not Set Yet';

  if (user.role === 'CLIENT') {
    const client = await Client.findOne({ auth: user._id });
    stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'ARTIST') {
    const artist = await Artist.findOne({ auth: user._id });
    stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
  }

  if (user.role === 'BUSINESS') {
    const business = await Business.findOne({ auth: user._id });
    stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
  }

  // Prepare user data for tokens
  const jwtPayload = {
    id: user._id.toString(),
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    stringLocation: stringLocation,
    email: user.email,
    image: user.image || defaultUserImage,
    role: user.role,
  };

  const accessToken = createAccessToken(jwtPayload);

  return {
    accessToken,
  };
};

export const AuthService = {
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

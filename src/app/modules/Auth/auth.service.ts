/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import httpStatus from 'http-status';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
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

const OTP_EXPIRY_MINUTES = Number(config.otp_expiry_minutes);

// 1. createAuth
const createAuth = async (payload: IAuth) => {
  const existingUser = await Auth.findOne({ email: payload.email });

  // if user exists but unverified
  if (existingUser && !existingUser.isVerified) {
    const now = new Date();

    // if Token/OTP expired and sending new otp
    if (!existingUser.otpExpiry || existingUser.otpExpiry < now) {
      const otp = generateOtp();
      await sendOtpSms(payload.phoneNumber, otp);

      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(
        now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
      );
      await existingUser.save();

      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have an unverified account, verify it with the new OTP sent to you!'
      );
    }

    // if OTP is valid till now
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You have an unverified account, verify it now!'
    );
  }

  // if user is already verified
  if (existingUser && existingUser.isVerified) {
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
    isVerified: false,
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
  const user = await Auth.findOne({ email: userEmail });

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You must sign up first to get an OTP!'
    );
  }

  if (user.isVerified) {
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
  const user = await Auth.findOne({ email: userEmail });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user.isVerified) {
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
  user.isVerified = true;
  await user.save();

  // Prepare user payload for tokens
  const userData = {
    id: user._id.toString(),
    email: user.email,
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
const signinIntoDB = async (payload: { email: string; password: string }) => {
  const user = await Auth.findOne({ email: payload.email }).select('+password');

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User does not exist!');
  }

  if (!user.isVerified) {
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
      'This account is registered via social login. Please sign in using your social account.'
    );
  }
  // Validate password
  const isPasswordCorrect = await user.isPasswordMatched(payload.password);

  if (!isPasswordCorrect) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials!');
  }

  // Prepare user data for tokens
  const userData = {
    id: user._id.toString(),
    fullName: user?.fullName,
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
    location,

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
  const idCardFront = files.idFrontPart?.[0]?.path || '';
  const idCardBack = files.idBackPart?.[0]?.path || '';
  const selfieWithId = files.selfieWithId?.[0]?.path || '';

  // Business-specific file extractions
  const registrationCertificate =
    files.registrationCertificate?.[0]?.path || '';
  const taxIdOrEquivalent = files.taxIdOrEquivalent?.[0]?.path || '';
  const studioLicense = files.studioLicense?.[0]?.path || '';

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
        location,
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
      session.endSession();

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
        location,
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
      session.endSession();

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
        location,
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
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
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
//     session.endSession();

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
//   const idCardFront = files.idFrontPart?.[0]?.path || '';
//   const idCardBack = files.idBackPart?.[0]?.path || '';
//   const selfieWithId = files.selfieWithId?.[0]?.path || '';

//   // Start a MongoDB session for transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
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
//     session.endSession();

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
//               file.path,
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
//     files.registrationCertificate?.[0]?.path || '';
//   const taxIdOrEquivalent = files.taxIdOrEquivalent?.[0]?.path || '';
//   const studioLicense = files.studioLicense?.[0]?.path || '';

//   // Start a MongoDB session for transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
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
//               file.path,
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
  const auth = await Auth.findOne({ email });

  if (!auth) {
    const authRes = await Auth.create({
      email,
      fcmToken,
      image,
      fullName,
      phoneNumber,
      address,
      isSocialLogin: true,
      isVerified: true,
    });

    if (!authRes) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create user into database!'
      );
    }

    // const accessToken = authRes.generateAccessToken();
    // const refreshToken = authRes.generateRefreshToken();

    const userData = {
      id: authRes._id.toString(),
      email: authRes.email,
      role: authRes.role,
      image: authRes?.image || defaultUserImage,
      fullName: authRes?.fullName,
    };

    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(userData);

    await Auth.findByIdAndUpdate(authRes._id, { refreshToken });

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
    // const accessToken = auth.generateAccessToken();
    // const refreshToken = auth.generateRefreshToken();

    const userData = {
      id: auth._id.toString(),
      email: auth.email,
      role: auth.role,
      image: auth?.image || defaultUserImage,
      fullName: auth?.fullName,
    };

    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(userData);

    auth.refreshToken = refreshToken;
    await auth.save({ validateBeforeSave: false });

    return {
      response: {
        fullName: auth.fullName,
        email: auth.email,
        phoneNumber: auth.phoneNumber,
        role: auth.role,
        image: auth.image,
        isProfile: auth.isProfile,
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

  const res = await Auth.findByIdAndUpdate(
    user._id,
    { image: file.path },
    { new: true }
  ).select('fullName email image role isProfile phoneNumber');

  return res;
};

// 8. changePasswordIntoDB
const changePasswordIntoDB = async (
  accessToken: string,
  payload: z.infer<typeof AuthValidation.changePasswordSchema.shape.body>
) => {
  const { id, iat } = verifyToken(
    accessToken,
    config.jwt.access_secret!
  ) as JwtPayload;

  const user = await Auth.findOne({ _id: id, isActive: true }).select(
    '+password'
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not exists!');
  }

  if (
    user.passwordChangedAt &&
    user.isJWTIssuedBeforePasswordChanged(iat as number)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
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
  user.passwordChangedAt = new Date();

  await user.save();

  return null;
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
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
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

  // ✅ OTP verified → issue reset password token
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
    throw new AppError(httpStatus.NOT_FOUND, 'profile not found');
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentUser = await Auth.findById(user._id).session(session);
    if (!currentUser)
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');

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
    session.endSession();
    return {
      email: currentUser.email,
      id: currentUser._id,
      fullName: currentUser.fullName,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const AuthService = {
  createAuth,
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
};

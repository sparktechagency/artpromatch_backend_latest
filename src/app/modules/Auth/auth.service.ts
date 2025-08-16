/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload } from 'jsonwebtoken';
import { generateOtp, verifyToken } from '../../lib';
import sendOtpSms from '../../utils/sendOtpSms';
import { IAuth } from './auth.interface';
import config from '../../config';
import { AppError, Logger, sendOtpEmail } from '../../utils';
import status from 'http-status';
import Auth from './auth.model';
import { AuthValidation, TProfilePayload } from './auth.validation';
import { ROLE } from './auth.constant';
import Client from '../Client/client.model';
import ClientPreferences from '../ClientPreferences/clientPreferences.model';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Artist from '../Artist/artist.model';
import { TProfileFileFields, TSocialLoginPayload } from '../../types';
import fs from 'fs';
import ArtistPreferences from '../ArtistPreferences/artistPreferences.model';
import Business from '../Business/business.model';
import BusinessPreferences from '../BusinessPreferences/businessPreferences.model';
import { z } from 'zod';


const createAuth = async (payload: IAuth) => {
  const existingUser = await Auth.findOne({ email: payload.email });

  if (existingUser) {
    throw new AppError(status.BAD_REQUEST, 'User already exists');
  }

  const otp = generateOtp();
  // await sendOtpSms(payload.phoneNumber, otp);
  const token = jwt.sign({ ...payload, otp }, config.jwt_access_secret!, {
    expiresIn: '5m',
  });

  return { token, otp };
};

const signupOtpSendAgain = async (token: string) => {
  const decoded = jwt.decode(token) as JwtPayload;

  const authData = {
    email: decoded.email,
    phoneNumber: decoded.phoneNumber,
    password: decoded.password,
  };

  const otp = generateOtp();
  // await sendOtpSms(decoded.phoneNumber, otp);
  const newToken = jwt.sign({ ...authData, otp }, config.jwt_access_secret!, {
    expiresIn: '5m',
  });

  return { token: newToken, otp };
};

const saveAuthIntoDB = async (token: string, otp: number) => {
  const decoded = jwt.verify(token, config.jwt_access_secret!) as JwtPayload;

  const existingUser = await Auth.findOne({ email: decoded.email });

  if (existingUser) {
    throw new AppError(status.BAD_REQUEST, 'User already exists');
  }

  if (decoded?.otp !== otp) {
    throw new AppError(status.BAD_REQUEST, 'Invalid OTP');
  }

  const result = await Auth.create({
    fullName: decoded.fullName,
    phoneNumber: decoded.phoneNumber,
    email: decoded.email,
    password: decoded.password,
    isVerified: true,
  });

  if (!result) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to save user info'
    );
  }

  const accessToken = result.generateAccessToken();
  const refreshToken = result.generateRefreshToken();

  return { accessToken, refreshToken };
};

const signinIntoDB = async (payload: { email: string; password: string }) => {
  const user = await Auth.findOne({ email: payload.email }).select('+password');

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not exists!');
  }

  if (user.isSocialLogin) {
    throw new AppError(
      status.BAD_REQUEST,
      'This account is registered via social login. Please sign in using your social account.'
    );
  }

  const isPasswordCorrect = await bcrypt.compare(
    payload.password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid credentials');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    isProfile: user.isProfile,
    role: user.role,
    accessToken,
    refreshToken,
  };
};

const saveProfileIntoDB = async (
  payload: TProfilePayload,
  user: IAuth,
  files: TProfileFileFields
) => {
  // 🔐 Prevent creating multiple profiles for same user
  if (user.isProfile) {
    throw new AppError(
      status.BAD_REQUEST,
      'Profile already saved for this user'
    );
  }

  // 🔍 Destructure relevant fields from the payload
  const {
    role,
    favoriteTattoos,
    location,
    radius,
    lookingFor,
    notificationPreferences,
    artistType,
    city,
    expertise,
    studioName,
    businessType,
    servicesOffered,
    operatingHours,
    contactNumber,
    contactEmail,
  } = payload;

  // 📂 Extract file paths for ID verification images and business documents
  const idCardFront = files.idFrontPart?.[0]?.path || '';
  const idCardBack = files.idBackPart?.[0]?.path || '';
  const selfieWithId = files.selfieWithId?.[0]?.path || '';

  // Business-specific file extractions
  const registrationCertificate =
    files.registrationCertificate?.[0]?.path || '';
  const taxIdOrEquivalent = files.taxIdOrEquivalent?.[0]?.path || '';
  const studioLicense = files.studioLicense?.[0]?.path || '';

  // 🧾 Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /**
     * ==========================
     * 📌 CLIENT PROFILE CREATION
     * ==========================
     */
    if (role === ROLE.CLIENT) {
      const isExistClient = await Client.findOne({ auth: user._id });
      if (isExistClient) {
        throw new AppError(
          status.BAD_REQUEST,
          'Client data already saved in database'
        );
      }

      const clientPayload = {
        role,
        favoriteTattoos,
        location,
        radius,
        lookingFor,
        auth: user._id,
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
      const isExistArtist = await Artist.findOne({ auth: user._id });
      if (isExistArtist) {
        throw new AppError(
          status.BAD_REQUEST,
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
      const isExistBusiness = await Business.findOne({ auth: user._id });
      if (isExistBusiness) {
        throw new AppError(
          status.BAD_REQUEST,
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
            console.warn(
              'Failed to delete uploaded file:',
              file.path,
              deleteErr
            );
          }
        });
      });
    }

    // 🧾 Re-throw application-specific errors
    if (error instanceof AppError) {
      throw error;
    }

    // 🧾 Throw generic internal server error
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      error?.message || 'Failed to create profile. Please try again.'
    );
  }
};

const socialLoginServices = async (payload: TSocialLoginPayload) => {
  const { email, fcmToken, image, fullName, address } = payload;

  // Check if user exists
  const auth = await Auth.findOne({ email });

  if (!auth) {
    const authRes = await Auth.create({
      email,
      fcmToken,
      image,
      fullName,
      address,
      isSocialLogin: true,
      isVerified: true,
    });

    if (!authRes) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'Fail to create user into database'
      );
    }

    const accessToken = authRes.generateAccessToken();
    const refreshToken = authRes.generateRefreshToken();

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
    const accessToken = auth.generateAccessToken();
    const refreshToken = auth.generateRefreshToken();

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

const updateProfilePhoto = async (
  user: IAuth,
  file: Express.Multer.File | undefined
) => {
  if (!file?.path) {
    throw new AppError(status.BAD_REQUEST, 'File is required');
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

const changePasswordIntoDB = async (
  accessToken: string,
  payload: z.infer<typeof AuthValidation.passwordChangeSchema.shape.body>
) => {
  const { id } = await verifyToken(accessToken);
   
  console.log("id")
  const user = await Auth.findOne({ _id: id, isActive: true }).select(
    '+password'
  );

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not exists');
  }

  const isCredentialsCorrect = await user.isPasswordCorrect(
    payload.oldPassword
  );

  if (!isCredentialsCorrect) {
    throw new AppError(status.UNAUTHORIZED, 'Current password is not correct');
  }

  user.password = payload.newPassword;
  await user.save();

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await Auth.findOne({ email, isActive: true });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  const otp = generateOtp();
  await user.save();
  await sendOtpEmail(email, otp, user.fullName || 'Guest');

  const token = jwt.sign(
    {
      email,
      verificationCode: otp,
      verificationExpiry: new Date(Date.now() + 5 * 60 * 1000),
    },
    config.jwt_access_secret!,
    {
      expiresIn: '5m',
    }
  );

  return { token };
};

const verifyOtpForForgetPassword = async (payload: {
  token: string;
  otp: string;
}) => {
  const { email, verificationCode, verificationExpiry } = (await verifyToken(
    payload.token
  )) as any;
  const user = await Auth.findOne({ email, isActive: true });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  // Check if the OTP matches
  if (verificationCode !== payload.otp || !verificationExpiry) {
    throw new AppError(status.BAD_REQUEST, 'Invalid OTP');
  }

  // Check if OTP has expired
  if (Date.now() > new Date(verificationExpiry).getTime()) {
    throw new AppError(status.BAD_REQUEST, 'OTP has expired');
  }

  const resetPasswordToken = jwt.sign(
    {
      email: user.email,
      isResetPassword: true,
    },
    config.jwt_access_secret!,
    {
      expiresIn: '5d',
    }
  );

  return { resetPasswordToken };
};

const resetPasswordIntoDB = async (
  resetPasswordToken: string,
  newPassword: string
) => {
  const { email } = (await verifyToken(
    resetPasswordToken
  )) as any;


  const user = await Auth.findOne({ email, isActive: true });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  // Update the user's password
  user.password = newPassword;
  await user.save();

  return null;
};

const fetchProfileFromDB = async (user: IAuth) => {
  if (user?.role === ROLE.CLIENT) {
    const client = await Client.findOne({ auth: user._id }).populate([
      {
        path: 'auth',
        select: 'fullName image email phoneNumber isProfile',
      },
    ]);

    const preference = await ClientPreferences.findOne({
      clientId: client?._id,
    }).select('-clientId -updatedAt -createdAt -__v');

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
    }).select('-artistId -updatedAt -createdAt -__v');

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
    }).select('-businessId -updatedAt -createdAt -__v');

    return { ...business?.toObject(), preference };
  } else if (user?.role === ROLE.ADMIN || user?.role === ROLE.SUPER_ADMIN) {
    return user;
  }
};

const fetchAllConnectedAcount = async (user: IAuth) => {
  let currentUser; 
  
  if(user.role === ROLE.CLIENT){
    currentUser = await Client.findOne({ auth: user._id }).select('_id');
  }
  else if(user.role === ROLE.ARTIST){
    currentUser = await Artist.findOne({ auth: user._id }).select('_id')
  }
  else if(user.role === ROLE.BUSINESS){
     currentUser = await Business.findOne({ auth: user._id }).select('_id')
  }

  if (!currentUser) {
    throw new AppError(status.NOT_FOUND, 'profile not found');
  }
  
  console.log(currentUser)
  const result = await ClientPreferences.findOne(
    { clientId: currentUser._id },
    { connectedAccounts: 1, _id: 0 } 
  );

  return result;
};

export const AuthService = {
  createAuth,
  saveAuthIntoDB,
  signupOtpSendAgain,
  saveProfileIntoDB,
  signinIntoDB,
  socialLoginServices,
  updateProfilePhoto,
  changePasswordIntoDB,
  forgotPassword,
  verifyOtpForForgetPassword,
  resetPasswordIntoDB,
  fetchProfileFromDB,
  fetchAllConnectedAcount
};

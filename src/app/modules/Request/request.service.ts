/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { startSession } from 'mongoose';
import { AppError } from '../../utils';
import Artist from '../Artist/artist.model';
import { ROLE } from '../Auth/auth.constant';
import Business from '../Business/business.model';
import { IAuth } from './../Auth/auth.interface';
import { REQUEST_STATUS } from './request.constant';
import RequestModel from './request.model';
import { RequestPayload } from './request.validation';

const createRequestIntoDB = async (user: IAuth, payload: RequestPayload) => {
  // Artist send the request to business studios
  if (user.role === ROLE.ARTIST) {
    const artist = await Artist.findOne({ auth: user._id });
    const business = await Business.findOne({ _id: payload.receiverId });
    if (!artist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
    }
    if (!business) {
      throw new AppError(httpStatus.NOT_FOUND, 'business not found!');
    }
    if (artist.business?.toString() === payload.receiverId) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'This Artist Already Join Your Studio'
      );
    }
    const isExistRequest = await RequestModel.findOne({
      $and: [{ artistId: artist._id }, { businessId: payload.receiverId }],
    });
    if (isExistRequest) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Request already sent by you or business'
      );
    }
    const requestPayload = {
      senderType: ROLE.ARTIST,
      artistId: artist._id,
      BusinessId: payload.receiverId,
      status: REQUEST_STATUS.PENDING,
    };
    const result = await RequestModel.create(requestPayload);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Failed To create Request');
    }
    return result;
  }

  // business send the request to artist
  if (user.role === ROLE.BUSINESS) {
    const business = await Business.findOne({ auth: user._id });
    if (!business) {
      throw new AppError(httpStatus.NOT_FOUND, 'business not found!');
    }

    const artist = await Artist.findOne({ _id: payload.receiverId });
    if (!artist) {
      throw new AppError(httpStatus.NOT_FOUND, 'artist not found!');
    }

    const isExistRequest = await RequestModel.findOne({
      $and: [{ artistId: payload.receiverId }, { businessId: business._id }],
    });
    if (isExistRequest) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Request already sent by you or Artist!'
      );
    }
    const requestPayload = {
      senderType: ROLE.BUSINESS,
      artistId: payload.receiverId,
      businessId: business._id,
      status: REQUEST_STATUS.PENDING,
    };
    const result = await RequestModel.create(requestPayload);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Failed To create Request');
    }
    return result;
  }
};

// fetch my request

const fetchMyRequest = async (
  user: IAuth,
  query: Record<string, any> = {}
): Promise<{
  meta: { page: number; limit: number; total: number; totalPage: number };
  data: any[];
}> => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const isArtist = user.role === ROLE.ARTIST;

  const myId = isArtist
    ? (await Artist.findOne({ auth: user._id }).select('_id'))?._id
    : (await Business.findOne({ auth: user._id }).select('_id'))?._id;

  if (!myId) return { meta: { total: 0, totalPage: 0, page, limit }, data: [] };

  const match: any = isArtist
    ? { senderType: 'ARTIST', artistId: myId }
    : { senderType: 'BUSINESS', businessId: myId };

  const pipeline: any[] = [
    { $match: match },
    {
      $lookup: {
        from: isArtist ? 'businesses' : 'artists',
        localField: isArtist ? 'businessId' : 'artistId',
        foreignField: '_id',
        as: 'provider',
      },
    },
    { $unwind: '$provider' },

    {
      $lookup: {
        from: 'auths',
        localField: 'provider.auth',
        foreignField: '_id',
        as: 'user',
      },
    },

    { $unwind: '$user' },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        requestId: '$_id',
        status: 1,
        createdAt: 1,
        provider: {
          id: '$provider._id', // provider ID
          name: '$user.fullName',
          email: '$user.email',
          phone: '$user.phoneNumber',
        },
      },
    },
  ];

  const data = await RequestModel.aggregate(pipeline);
  const total = await RequestModel.countDocuments(match);
  const totalPage = Math.ceil(total / limit);

  return {
    data: data,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

// fetch incoming request
const fetchIncomingRequest = async (
  user: IAuth,
  query: Record<string, any> = {}
): Promise<{
  meta: { page: number; limit: number; total: number; totalPage: number };
  data: any[];
}> => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const isArtist = user.role === ROLE.ARTIST;

  const myId = isArtist
    ? (await Artist.findOne({ auth: user._id }).select('_id'))?._id
    : (await Business.findOne({ auth: user._id }).select('_id'))?._id;

  if (!myId) return { meta: { total: 0, totalPage: 0, page, limit }, data: [] };

  const match: any = isArtist
    ? { artistId: myId, senderType: 'BUSINESS' }
    : { businessId: myId, senderType: 'ARTIST' };

  const pipeline: any[] = [
    { $match: match },

    {
      $lookup: {
        from: isArtist ? 'businesses' : 'artists',
        localField: isArtist ? 'businessId' : 'artistId',
        foreignField: '_id',
        as: 'provider',
      },
    },
    { $unwind: '$provider' },

    {
      $lookup: {
        from: 'auths',
        localField: 'provider.auth',
        foreignField: '_id',
        as: 'authUser',
      },
    },
    { $unwind: '$authUser' },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        _id: 0,
        requestId: '$_id',
        status: 1,
        createdAt: 1,
        provider: {
          id: '$provider._id',
          name: '$authUser.fullName',
          email: '$authUser.email',
          phone: '$authUser.phoneNumber',
        },
      },
    },
  ];

  const data = await RequestModel.aggregate(pipeline);
  const total = await RequestModel.countDocuments(match);
  const totalPage = Math.ceil(total / limit);

  return {
    data,
    meta: { page, limit, total, totalPage },
  };
};

// const fetchMyRequest = async (user: IAuth) => {
//   const requests = await RequestModel.find({
//     $or: [{ artistId: user._id }, { businessId: user._id }],
//   }).populate([
//     {
//       path: 'artistId',
//       select: '',
//       populate: {
//         path: 'auth',
//         model: 'Auth',
//         select: 'fullName email image',
//       },
//     },
//     {
//       path: 'businessId',
//       select: '',
//       populate: {
//         path: 'auth',
//         model: 'Auth',
//         select: 'fullName email image',
//       },
//     },
//   ]);
//   return requests;
// };

const acceptRequestFromArtist = async (user: IAuth, requestId: string) => {
  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const request = await RequestModel.findOne({
    _id: requestId,
    artistId: artist._id,
  });

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, 'Request not found!');
  }

  const business = await Business.findById(request.businessId);

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  const session = await startSession();

  try {
    session.startTransaction();

    await Business.findByIdAndUpdate(
      business._id,
      {
        $addToSet: { residentArtists: request.artistId },
      },
      { session }
    );

    await RequestModel.findByIdAndDelete(request._id, { session });

    await session.commitTransaction();
    await session.endSession();

    return null;
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Something went wrong when accept request: ${error?.message}`
    );
  }
};

const removeRequest = async (requestId: string) => {
  return await RequestModel.findByIdAndDelete(requestId);
};

export const RequestService = {
  createRequestIntoDB,
  fetchMyRequest,
  acceptRequestFromArtist,
  removeRequest,
  fetchIncomingRequest,
};

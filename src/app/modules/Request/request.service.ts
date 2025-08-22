/* eslint-disable @typescript-eslint/no-explicit-any */
import status from 'http-status';
import { AppError } from '../../utils';
import Business from '../Business/business.model';
import { IAuth } from './../Auth/auth.interface';
import RequestModel from './request.model';
import Artist from '../Artist/artist.model';
import mongoose from 'mongoose';
import { ROLE } from '../Auth/auth.constant';
import { REQUEST_STATUS } from './request.constant';
import { RequestPayload } from './request.validation';
import { IArtist } from '../Artist/artist.interface';

const createRequestIntoDB = async (user: IAuth, payload:RequestPayload) => {
  
  // Artist send the request to business studios
  if(user.role === ROLE.ARTIST){
    const artist = await Artist.findOne({auth: user._id});
    console.log("artist",artist)
    const business = await Business.findOne({_id: payload.receiverId})
    if(!artist){
      throw new AppError(status.NOT_FOUND, 'Artist not found');
    }
       if(!business){
      throw new AppError(status.NOT_FOUND, 'business not found');
    }
    if(artist.business?.toString() === payload.receiverId){
       throw new AppError(status.NOT_FOUND, 'This Artist Already Join Your Studio');
    }
    const isExistRequest = await RequestModel.findOne({$and: [{artistId: artist._id}, {businessId: payload.receiverId}]});
    if(isExistRequest){
       throw new AppError(status.BAD_REQUEST, 'Request already sent by you or business');
    }
    const requestPayload = {
      senderType: ROLE.ARTIST,
      artistId: artist._id,
      BusinessId: payload.receiverId,
      status: REQUEST_STATUS.PENDING
    }
    const result = await RequestModel.create(requestPayload);
    if(!result){
      throw new AppError(status.NOT_FOUND, 'Failed To create Request');
    }
    return result;
  }
  
  // business send the request to artist
  if(user.role === ROLE.BUSINESS){
    const business = await Business.findOne({auth: user._id});
    if(!business){
      throw new AppError(status.NOT_FOUND, 'business not found');
    }
    
    const artist = await Artist.findOne({_id:payload.receiverId})
    if(!artist){
       throw new AppError(status.NOT_FOUND, 'artist not found');
    }
    console.log(artist)
    
    const isExistRequest = await RequestModel.findOne({$and: [{artistId: payload.receiverId}, {businessId: business._id}]});
    if(isExistRequest){
       throw new AppError(status.BAD_REQUEST, 'Request already sent by you or Artist!');
    }
    const requestPayload = {
      senderType: ROLE.BUSINESS,
      artistId: payload.receiverId,
      businessId: business._id,
      status: REQUEST_STATUS.PENDING
    }
    const result = await RequestModel.create(requestPayload);
    if(!result){
      throw new AppError(status.NOT_FOUND, 'Failed To create Request');
    }
    return result;
  }  
};


// fetch my request

const fetchMyRequest = async (
  user: IAuth,
  query: Record<string, any> = {}
): Promise<{
  meta: { page: number; limit: number; total: number; totalPages: number };
  data: any[];
}> => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const { page: _p, limit: _l, ...filters } = query;

  // 1️⃣ Resolve user Auth ID to Artist/Business ID
  let artistId: mongoose.Types.ObjectId | null = null;
  let businessId: mongoose.Types.ObjectId | null = null;

  if (user.role === ROLE.ARTIST) {
    const artist:any = await Artist.findOne({ auth: user._id }).select("_id");
    artistId = artist?._id || null;
  } else if (user.role === ROLE.BUSINESS) {
    const business:any = await Business.findOne({ auth: user._id }).select("_id");
    businessId = business?._id || null;
  }

  if (!artistId && !businessId) {
    return {
      meta: { page, limit, total: 0, totalPages: 0 },
      data: [],
    };
  }

  // 2️⃣ Build match stage
  const match: Record<string, any> = { $or: [], ...filters };
  if (artistId) match.$or.push({ artistId: artistId });
  if (businessId) match.$or.push({ businessId: businessId });

  // Determine role for the lookup
  const isArtist = !!artistId;

  // 3️⃣ Aggregation pipeline
  const pipeline: any[] = [
    { $match: match },

    // Lookup the "other" person
    {
      $lookup: {
        from: isArtist ? "businesses" : "artists",
        localField: isArtist ? "businessId" : "artistId",
        foreignField: "_id",
        as: "other",
      },
    },
    { $unwind: { path: "$other", preserveNullAndEmptyArrays: true } },

    // Lookup auth info of the other person
    {
      $lookup: {
        from: "auths",
        localField: "other.auth",
        foreignField: "_id",
        as: "other.auth",
      },
    },
    { $unwind: { path: "$other.auth", preserveNullAndEmptyArrays: true } },

    { $sort: { createdAt: -1 } },

    // Pagination + total count
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              status: 1,
              createdAt: 1,
              "other._id": 1,
              "other.auth.fullName": 1,
              "other.auth.email": 1,
              "other.auth.image": 1,
            },
          },
        ],
        meta: [{ $count: "total" }],
      },
    },

    { $unwind: { path: "$meta", preserveNullAndEmptyArrays: true } },
    { $addFields: { "meta.total": { $ifNull: ["$meta.total", 0] } } },
  ];

  const result = await RequestModel.aggregate(pipeline);
  const total = result[0]?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: { page, limit, total, totalPages },
    data: result[0]?.data || [],
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
    throw new AppError(status.NOT_FOUND, 'Artist not found');
  }

  const request = await RequestModel.findOne({
    _id: requestId,
    artistId: artist._id,
  });

  if (!request) {
    throw new AppError(status.NOT_FOUND, 'Request not found');
  }

  const business = await Business.findById(request.businessId);

  if (!business) {
    throw new AppError(status.NOT_FOUND, 'Business not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
      status.INTERNAL_SERVER_ERROR,
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
};

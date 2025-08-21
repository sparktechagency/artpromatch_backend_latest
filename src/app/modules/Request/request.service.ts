/* eslint-disable @typescript-eslint/no-explicit-any */
import status from 'http-status';
import { AppError } from '../../utils';
import Business from '../Business/business.model';
import { IAuth } from './../Auth/auth.interface';
import RequestModel from './request.model';
import Artist from '../Artist/artist.model';
import mongoose from 'mongoose';
import { IRequest } from './request.interface';
import { ROLE } from '../Auth/auth.constant';
import { REQUEST_STATUS } from './request.constant';
import { RequestPayload } from './request.validation';
import { IArtist } from '../Artist/artist.interface';

const createRequestIntoDB = async (user: IAuth, payload:RequestPayload) => {
  
  // Artist send the request to business studios
  if(user.role === ROLE.ARTIST){
    const artist = await Artist.findOne({auth: user._id});
    const business = await Business.findOne({_id: payload.receiverId})
    if(!artist){
      throw new AppError(status.NOT_FOUND, 'Artist not found');
    }
       if(!business){
      throw new AppError(status.NOT_FOUND, 'business not found');
    }
    if(artist.business && artist.isConnBusiness){
      throw new AppError(status.BAD_REQUEST, `you can't send request any studios! because you already have joined another studio`);
    }
    if(artist.business?.toString() === payload.receiverId){
       throw new AppError(status.NOT_FOUND, 'This Artist Already Join Your Studio');
    }
    const isExistRequest = await RequestModel.findOne({$and: [{artistId: artist._id}, {businessId: payload.receiverId}]});
    if(isExistRequest){
       throw new AppError(status.BAD_REQUEST, 'Request already sent');
    }
    const requestPayload = {
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
    
    const artist:IArtist = await Artist.findOne({_id:payload.receiverId}).select("sConnBusiness business")
    
    
    if(artist.business && artist.isConnBusiness){
      throw new AppError(status.BAD_REQUEST, `you can't send request any artist! because This artist have joined another studio`);
    }
    const isExistRequest = await RequestModel.findOne({$and: [{artistId: payload.receiverId}, {businessId: business._id}]});
    if(isExistRequest){
       throw new AppError(status.BAD_REQUEST, 'Request already sent');
    }
    const requestPayload = {
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
  

};

const fetchRequestByArtist = async (user: IAuth) => {
  const requests = await RequestModel.find({
    $or: [{ artistId: user._id }, { businessId: user._id }],
  }).populate([
    {
      path: 'artistId',
      select: '',
      populate: {
        path: 'auth',
        model: 'Auth',
        select: 'fullName email image',
      },
    },
    {
      path: 'businessId',
      select: '',
      populate: {
        path: 'auth',
        model: 'Auth',
        select: 'fullName email image',
      },
    },
  ]);
  return requests;
};

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
  fetchRequestByArtist,
  acceptRequestFromArtist,
  removeRequest,
};

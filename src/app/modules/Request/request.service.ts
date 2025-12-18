/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../utils';
import Artist from '../Artist/artist.model';
import { ROLE } from '../Auth/auth.constant';
import { IAuth } from '../Auth/auth.interface';
import Business from '../Business/business.model';
import { NOTIFICATION_TYPE } from '../notificationModule/notification.constant';
import { sendNotificationBySocket } from '../notificationModule/notification.utils';
import { REQUEST_STATUS } from './request.constant';
import RequestModel from './request.model';

// createRequestIntoDB
const createRequestIntoDB = async (user: IAuth, artistId: string) => {
  // business send the request to artist to work with in his business studios
  const business = await Business.findOne(
    { auth: user._id },
    '_id  totalArtistSpots studioName'
  );

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'No business found!');
  }

  const artist = await Artist.findById(artistId).populate<{ auth: IAuth }>(
    'auth'
  );

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'No artist found!');
  }

  if (artist.isConnBusiness) {
    if (artist.business?.toString() === business._id.toString()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'This artist is already connected to your business!'
      );
    }

    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This artist is already connected to another business!'
    );
  }

  const isExistRequest = await RequestModel.findOne({
    artistId,
    businessId: business._id,
    status: { $ne: 'rejected' },
  });

  if (isExistRequest) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Request already sent!');
  }

  const requestPayload = {
    artistId: artistId,
    businessId: business._id,
    status: REQUEST_STATUS.PENDING,
  };

  const result = await RequestModel.create(requestPayload);

  if (!result) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed To create Request!'
    );
  }

  const notificationPayload = {
    title: 'Ioin studio request',
    message: `${business.studioName} request you to join their business studio`,
    receiver: artist.auth._id,
    type: NOTIFICATION_TYPE.JOIN_STUDIO_REQUEST,
  };

  await sendNotificationBySocket(notificationPayload);

  return {
    requestId: result._id,
    artistName: artist.auth?.fullName,
    businessName: business.studioName,
    status: result.status,
  };
};

// fetchAllMyRequestsFromDB
const fetchAllMyRequestsFromDB = async (
  userData: IAuth,
  query: Record<string, any> = {}
) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const isArtist = userData.role === ROLE.ARTIST;

  // find logged in user's ref (artistId or businessId)
  const myId = isArtist
    ? (await Artist.findOne({ auth: userData._id }).select('_id'))?._id
    : (await Business.findOne({ auth: userData._id }).select('_id'))?._id;

  if (!myId) {
    return {
      meta: { total: 0, totalPage: 0, page, limit },
      data: [],
    };
  }

  const match: any = isArtist ? { artistId: myId } : { businessId: myId };

  const pipeline: any[] = [
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
                    // city: 1,
                    stringLocation: 1,
                    auth: 1,
                  },
                },
              ],
              as: 'businessInfo',
            },
          },
          {
            $unwind: {
              path: '$businessInfo',
              preserveNullAndEmptyArrays: true,
            },
          },

          // lookup auth for business (to get contact)
          {
            $lookup: {
              from: 'auths', // your Auth collection
              localField: 'businessInfo.auth',
              foreignField: '_id',
              as: 'businessAuth',
            },
          },
          {
            $unwind: {
              path: '$businessAuth',
              preserveNullAndEmptyArrays: true,
            },
          },
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
                    // city: 1,
                    stringLocation: 1,
                  },
                },
              ],
              as: 'artistInfo',
            },
          },
          {
            $unwind: {
              path: '$artistInfo',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: 'auths',
              localField: 'artistInfo.auth',
              foreignField: '_id',
              as: 'artistAuth',
            },
          },
          {
            $unwind: {
              path: '$artistAuth',
              preserveNullAndEmptyArrays: true,
            },
          },
        ]),

    // final projection
    {
      $project: isArtist
        ? {
            _id: 1,
            status: 1,
            businessName: '$businessInfo.studioName',
            businessAuthId: '$businessAuth._id',
            image: '$businessInfo.image',
            // city: '$businessInfo.city',
            stringLocation: '$businessInfo.stringLocation',
            email: '$businessAuth.email',
            phone: '$businessAuth.phoneNumber',
            createdAt: 1,
          }
        : {
            _id: 1,
            status: 1,
            artistName: '$artistAuth.fullName',
            artistAuthId: '$artistAuth._id',
            artistId: '$artistInfo._id',
            image: '$artistAuth.image',
            // city: '$artistInfo.city',
            stringLocation: '$artistInfo.stringLocation',
            type: '$artistInfo.type',
            email: '$artistAuth.email',
            phone: '$artistAuth.phoneNumber',
            createdAt: 1,
          },
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await RequestModel.aggregate(pipeline);
  const total = await RequestModel.countDocuments(match);
  const totalPage = Math.ceil(total / limit);

  return {
    data,
    meta: { page, limit, total, totalPage },
  };
};

// artistAcceptRequestIntoDb
const artistAcceptRequestIntoDb = async (user: IAuth, requestId: string) => {
  // Check if artist exists
  const artist = await Artist.findOne(
    { auth: user._id },
    'business isConnBusiness'
  );

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // Find the request by ID and ensure it belongs to this artist
  const request = await RequestModel.findOne({
    _id: requestId,
    artistId: artist._id,
  });

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, 'Request not found!');
  }

  // Find the business linked to the request
  const business = await Business.findById(request.businessId);

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // Check if the artist is already connected to a business
  if (artist.business && artist.isConnBusiness) {
    if (artist.business?.toString() === business._id.toString()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You are already connected to this business!'
      );
    }

    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You are already connected to another business!'
    );
  }

  // Update the request status to 'accepted'
  const result = await RequestModel.findByIdAndUpdate(
    requestId,
    { $set: { status: 'accepted' } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to accept the request!');
  }

  // Connect the artist to the business
  artist.business = business._id;
  artist.isConnBusiness = true;
  artist.stringLocation = business.stringLocation;
  artist.mainLocation.coordinates = business.location.coordinates;
  artist.currentLocation.coordinates = business.location.coordinates;

  await artist.save();

  // business.totalArtistSpots++;
  // business.filledArtistSpots++;
  // await business.save();

  return result;
};

// artistRejectRequestIntoDb
const artistRejectRequestIntoDb = async (user: IAuth, requestId: string) => {
  // Check if artist exists
  const artist = await Artist.findOne(
    { auth: user._id },
    'business isConnBusiness'
  );

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // Find the request by ID and ensure it belongs to this artist
  const request = await RequestModel.findOne({
    _id: requestId,
    artistId: artist._id,
  });

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, 'Request not found!');
  }

  // Find the business linked to the request
  const business = await Business.findById(request.businessId);

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // Check if the artist is already connected to the same business and rejecting their own request
  if (
    artist.isConnBusiness &&
    artist.business &&
    artist.business?.toString() === business?._id?.toString()
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot reject a request from a business you are already connected to!'
    );
  }

  // Update the request status to 'rejected'
  const result = await RequestModel.findByIdAndUpdate(
    requestId,
    { $set: { status: 'rejected' } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to reject the request!');
  }

  return result;
};

// addToJoinStudioIntoDb
const addToJoinStudioIntoDb = async (user: IAuth, requestId: string) => {
  const request = await RequestModel.findOne({
    _id: requestId,
  });

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, 'Request not found!');
  }

  const artist = await Artist.findOne({ _id: request.artistId }, '_id');

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  if (artist.business && artist.isConnBusiness)
    throw new AppError(
      httpStatus.NOT_FOUND,
      'This artist already joined another studio!'
    );

  if (request.status !== 'accepted')
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Artist don't accept you request"
    );

  const business = await Artist.findOne(
    { auth: user.id },
    'business isConnBusiness'
  );

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  const result = await Artist.findByIdAndUpdate(
    artist._id,
    { $set: { business: business._id, isConnBusiness: true } },
    { new: true }
  );
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'status not updated');
  return request;
};

// removeRequestFromDB
// const removeRequestFromDB = async (requestId: string) => {
//   return await RequestModel.findByIdAndDelete(requestId);
// };

export const RequestService = {
  createRequestIntoDB,
  fetchAllMyRequestsFromDB,
  artistAcceptRequestIntoDb,
  artistRejectRequestIntoDb,
  addToJoinStudioIntoDb,
  // removeRequestFromDB,
};

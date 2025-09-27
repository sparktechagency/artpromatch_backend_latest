import httpStatus from 'http-status';
import { AppError } from '../../utils';
import Folder from '../Folder/folder.model';
// import fs from 'fs';
import { PipelineStage } from 'mongoose';
import QueryBuilder from 'mongoose-query-builders';
import config from '../../config';
import Artist from '../Artist/artist.model';
import { IAuth } from '../Auth/auth.interface';
import { Auth } from '../Auth/auth.model';
import Booking from '../Booking/booking.model';
import { ArtistBoost } from '../BoostProfile/boost.profile.model';
import Business from '../Business/business.model';
import Client from '../Client/client.model';
import SecretReview from '../SecretReview/secretReview.model';

// getAllArtistsFoldersFromDB
const getAllArtistsFoldersFromDB = async () => {
  return await Folder.find();
};

// // changeStatusOnFolder
// const changeStatusOnFolder = async (folderId: string, permission: boolean) => {
//   const folder = await Folder.findById(folderId);

//   if (!folder) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
//   }

//   const artist = await Artist.findOne({ auth: folder.auth });

//   if (!artist) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
//   }

//   if (permission) {
//     if (folder.for === 'portfolio') {
//       await Artist.findByIdAndUpdate(artist?._id, {
//         $addToSet: {
//           portfolio: {
//             folder: folder._id,
//             position: artist?.portfolio?.length + 1,
//           },
//         },
//       });
//       return await Folder.findByIdAndUpdate(folderId, {
//         isPublished: true,
//       });
//     } else if (folder.for === 'flash') {
//       await Artist.findByIdAndUpdate(artist?._id, {
//         $addToSet: {
//           flashes: {
//             folder: folder._id,
//             position: artist?.flashes?.length + 1,
//           },
//         },
//       });
//       return await Folder.findByIdAndUpdate(folderId, {
//         isPublished: true,
//       });
//     }
//   } else {
//     const deletedFolder = await Folder.findByIdAndDelete(folderId);
//     deletedFolder?.images?.forEach((path) => fs.unlink(path, () => {}));
//   }
// };

// verifyArtistByAdminIntoDB
const verifyArtistByAdminIntoDB = async (artistId: string) => {
  const artist = await Artist.findById(artistId).populate('auth');

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authDoc = artist.auth as any;
  authDoc.isActive = true;
  await authDoc.save();
  return null;
};

// verifyBusinessByAdminIntoDB
const verifyBusinessByAdminIntoDB = async (businessId: string) => {
  const result = await Business.findByIdAndUpdate(
    businessId,
    { isActive: true },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  return result;
};

// fetchAllArtistsFromDB
const fetchAllArtistsFromDB = async (query: Record<string, unknown>) => {
  const artistQuery = new QueryBuilder(
    Artist.find().populate([
      {
        path: 'auth',
        select: 'fullName image email phoneNumber isProfile',
      },
    ]),
    query
  )
    .search(['type', 'expertise', 'city'])
    .filter()
    .sort()
    .sort()
    .paginate();

  const data = await artistQuery.modelQuery;
  const meta = await artistQuery.countTotal();

  return { data, meta };
};

// fetchAllBusinessesFromDB
const fetchAllBusinessesFromDB = async (query: Record<string, unknown>) => {
  const businessQuery = new QueryBuilder(
    Business.find().populate([
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
    ]),
    query
  )
    .search([
      'city',
      'servicesOffered',
      'businessType',
      'studioName',
      'studioName',
    ])
    .filter()
    .sort()
    .sort()
    .paginate();

  const data = await businessQuery.modelQuery;
  const meta = await businessQuery.countTotal();

  return { data, meta };
};

// fetchAllClientsFromDB
const fetchAllClientsFromDB = async (query: Record<string, unknown>) => {
  const businessQuery = new QueryBuilder(
    Client.find().populate([
      {
        path: 'auth',
        select: 'fullName image email phoneNumber isProfile',
      },
    ]),
    query
  )
    .search([
      'preferredArtistType',
      'favoritePiercing',
      'country',
      'favoriteTattoos',
      'lookingFor',
    ])
    .filter()
    .sort()
    .sort()
    .paginate();

  const data = await businessQuery.modelQuery;
  const meta = await businessQuery.countTotal();

  return { data, meta };
};

// fetchAllSecretReviewsFromDB
const fetchAllSecretReviewsFromDB = async (query: Record<string, unknown>) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pipeline: PipelineStage[] = [
    // join service
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'service',
      },
    },
    { $unwind: '$service' },

    // join artist
    {
      $lookup: {
        from: 'artists',
        localField: 'service.artist',
        foreignField: '_id',
        as: 'artist',
      },
    },
    { $unwind: '$artist' },

    // join auth
    {
      $lookup: {
        from: 'auths',
        localField: 'artist.auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    { $unwind: '$auth' },

    // join booking
    {
      $lookup: {
        from: 'bookings',
        localField: 'booking',
        foreignField: '_id',
        as: 'booking',
      },
    },
    { $unwind: '$booking' },

    // custom alias projection
    {
      $project: {
        description: 1,
        createdAt: 1,

        serviceTitle: '$service.title',
        servicePrice: '$service.price',
        serviceThumbnail: '$service.thumbnail',
        serviceAvgRating: '$service.avgRating',
        serviceTotalReviewCount: '$service.totalReviewCount',
        serviceTotalCompletedOrder: '$service.totalCompletedOrder',

        artistType: '$artist.type',
        artistExpertise: '$artist.expertise',
        artistCity: '$artist.city',

        artistEmail: '$auth.email',
        artistFullName: '$auth.fullName',
        artistPhone: '$auth.phoneNumber',
        artistImage: '$auth.image',

        bookingDate: '$booking.originalDate',
        bookingLocation: '$booking.serviceLocation',
        bookingBodyPart: '$booking.bodyPart',
        bookingPaymentStatus: '$booking.paymentStatus',
        bookingReview: '$booking.review',
        bookingRating: '$booking.rating',
      },
    },
  ];

  // Search across all fields
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { description: { $regex: searchTerm, $options: 'i' } },
          { serviceTitle: { $regex: searchTerm, $options: 'i' } },
          { artistEmail: { $regex: searchTerm, $options: 'i' } },
          { artistPhone: { $regex: searchTerm, $options: 'i' } },
          { bookingReview: { $regex: searchTerm, $options: 'i' } },
          { bookingLocation: { $regex: searchTerm, $options: 'i' } },
          { bookingBodyPart: { $regex: searchTerm, $options: 'i' } },
        ],
      },
    });
  }

  // Sorting
  pipeline.push({
    $sort: { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 },
  });

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  pipeline.push({ $skip: skip }, { $limit: Number(limit) });

  const data = await SecretReview.aggregate(pipeline);

  // Count total (without pagination)
  const totalCountPipeline = [...pipeline];
  totalCountPipeline.splice(
    totalCountPipeline.findIndex((s) => '$skip' in s),
    2
  ); // remove skip + limit
  totalCountPipeline.push({ $count: 'total' });

  const totalResult = await SecretReview.aggregate(totalCountPipeline);

  const total = totalResult[0]?.total || 0;
  const meta = {
    page: Number(page),
    limit: Number(limit),
    total: total,
    totalPage: Math.ceil(total / Number(limit)),
  };

  return { data, meta };
};

const fetchDasboardPageData = async () => {
  const totalClients = await Auth.countDocuments({ role: 'CLIENT' });
  const totalArtists = await Auth.countDocuments({ role: 'ARTIST' });
  const totalBusinesses = await Auth.countDocuments({ role: 'BUSINESS' });
  const adminCommision = Number(config.admin_commision) / 100;
  const adminBookingIncomeAgg = await Booking.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $multiply: [
              { $subtract: ['$price', '$stripeFee'] }, // artist earnings
              adminCommision, // 5% admin cut
            ],
          },
        },
      },
    },
  ]);

  // Admin income from boosts (assuming full amount goes to admin)
  const adminBoostIncomeAgg = await ArtistBoost.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$charge' },
      },
    },
  ]);

  const totalAdminIncome =
    (adminBookingIncomeAgg[0]?.total || 0) +
    (adminBoostIncomeAgg[0]?.total || 0);

  // ---- New Users (last 5) ----

  const rawUsers = await Client.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate<{ auth: IAuth }>({
      path: 'auth',
      select: 'fullName email phoneNumber',
    });

  const newUsers = rawUsers.map((u) => ({
    _id: u._id,
    fullName: u.auth?.fullName || '',
    email: u.auth?.email || '',
    phone: u.auth?.phoneNumber || '',
  }));

  // ---- Top Artists (Example: by completed bookings count) ----
  const topArtists = await Booking.aggregate([
    { $match: { status: 'completed' } },

    {
      $group: {
        _id: '$artist',
        taskCompleted: { $sum: 1 },
      },
    },

    { $sort: { taskCompleted: -1 } },
    { $limit: 3 },

    {
      $lookup: {
        from: 'artists',
        localField: '_id',
        foreignField: '_id',
        as: 'artist',
      },
    },
    { $unwind: '$artist' },

    {
      $lookup: {
        from: 'auths',
        localField: 'artist.auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    { $unwind: '$auth' },

    {
      $project: {
        _id: 0,
        fullName: '$auth.fullName',
        type: '$artist.type',
      },
    },
  ]);

  return {
    stats: {
      totalClients,
      artists: totalArtists,
      businesses: totalBusinesses,
      earnings: totalAdminIncome,
    },
    newUsers,
    topArtists,
  };
};

const getYearlyAppointmentStats = async (year: number) => {
  const appointments = await Booking.aggregate([
    {
      $project: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
    },
    { $match: { year } },
    {
      $group: {
        _id: '$month',
        appointment: { $sum: 1 },
      },
    },
  ]);

  const result: { month: number; appointment: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const appt = appointments.find((a) => a._id === m);
    result.push({
      month: m,
      appointment: appt?.appointment || 0,
    });
  }

  return result;
};

// 2. Revenue grouped by year+month
const getYearlyRevenueStats = async (year: number) => {
  const adminCommision = Number(config.admin_commision) / 100;
  const bookingIncome = await Booking.aggregate([
    {
      $project: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        adminIncome: {
          $multiply: [{ $subtract: ['$price', '$stripeFee'] }, adminCommision],
        },
      },
    },
    { $match: { year } },
    {
      $group: {
        _id: '$month',
        earning: { $sum: '$adminIncome' },
      },
    },
  ]);

  // --- Boost income (full amount)
  const boostIncome = await ArtistBoost.aggregate([
    {
      $project: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        adminIncome: '$charge',
      },
    },
    { $match: { year } },
    {
      $group: {
        _id: '$month',
        earning: { $sum: '$adminIncome' },
      },
    },
  ]);

  // --- Merge both incomes month by month
  const result: { month: number; earning: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const booking = bookingIncome.find((b) => b._id === m)?.earning || 0;
    const boost = boostIncome.find((b) => b._id === m)?.earning || 0;

    result.push({
      month: m,
      earning: booking + boost,
    });
  }

  return result;
};

const getAllBookingsForAdminIntoDb = async (query: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const matchStage: Record<string, unknown> = {};

  if (query.search) {
    matchStage.$or = [
      { 'clientInfo.fullName': { $regex: query.search, $options: 'i' } },
      { 'clientInfo.phone': { $regex: query.search, $options: 'i' } },
      { 'artistInfo.fullName': { $regex: query.search, $options: 'i' } },
      { 'artistInfo.phone': { $regex: query.search, $options: 'i' } },
      { serviceName: { $regex: query.search, $options: 'i' } },
      { status: { $regex: query.search, $options: 'i' } },
      { paymentStatus: { $regex: query.search, $options: 'i' } },
    ];
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        serviceName: 1,
        status: 1,
        paymentStatus: 1,
        createdAt: 1,
        'clientInfo.fullName': 1,
        'clientInfo.phone': 1,
        'artistInfo.fullName': 1,
        'artistInfo.phone': 1,
        price: 1
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await Booking.aggregate(pipeline);

  return {
    meta: {
      page,
      limit,
      total: result[0]?.totalCount[0]?.count || 0,
    },
    data: result[0]?.data || [],
  };
};

export const AdminService = {
  getAllArtistsFoldersFromDB,
  // changeStatusOnFolder,
  getYearlyRevenueStats,
  getYearlyAppointmentStats,
  fetchDasboardPageData,
  verifyArtistByAdminIntoDB,
  verifyBusinessByAdminIntoDB,
  fetchAllArtistsFromDB,
  fetchAllBusinessesFromDB,
  fetchAllClientsFromDB,
  fetchAllSecretReviewsFromDB,
  getAllBookingsForAdminIntoDb,
};

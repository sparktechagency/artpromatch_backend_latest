import httpStatus from 'http-status';
import { AppError } from '../../utils';
import Folder from '../Folder/folder.model';
import { PipelineStage } from 'mongoose';
import QueryBuilder from 'mongoose-query-builders';
import config from '../../config';
import Artist from '../Artist/artist.model';
import { IAuth } from '../Auth/auth.interface';
import Auth from '../Auth/auth.model';
import Booking from '../Booking/booking.model';
import { ArtistBoost } from '../BoostProfile/boost.profile.model';
import Business from '../Business/business.model';
import Client from '../Client/client.model';
import SecretReview from '../SecretReview/secretReview.model';
import { ROLE } from '../Auth/auth.constant';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Service from '../Service/service.model';
// import { deleteImageFromCloudinary } from '../../utils/deleteImageFromCloudinary';

// Helper function to calculate growth rate
const calculateGrowthRate = (current: number, previous: number): string => {
  if (previous === 0) return current === 0 ? '0.0%' : '100.0%';
  const growth = ((current - previous) / previous) * 100;
  return growth.toFixed(1) + '%';
};

// 1. fetchDasboardPageData
const fetchDasboardPageData = async () => {
  // Get current date ranges
  const now = new Date();
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Get current month counts
  const [
    totalClients,
    totalArtists,
    totalBusinesses,
    lastMonthClients,
    lastMonthArtists,
    lastMonthBusinesses,
  ] = await Promise.all([
    // Current month counts
    Auth.countDocuments({
      role: ROLE.CLIENT,
    }),
    Auth.countDocuments({
      role: ROLE.ARTIST,
    }),
    Auth.countDocuments({
      role: ROLE.BUSINESS,
    }),
    // Previous month counts for comparison
    Auth.countDocuments({
      role: ROLE.CLIENT,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    Auth.countDocuments({
      role: ROLE.ARTIST,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    Auth.countDocuments({
      role: ROLE.BUSINESS,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
  ]);
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

  // Calculate current month earnings
  const currentMonthEarnings =
    (adminBookingIncomeAgg[0]?.total || 0) +
    (adminBoostIncomeAgg[0]?.total || 0);

  // Get previous month earnings for comparison
  const lastMonthEarningsAgg = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $multiply: [
              { $subtract: ['$price', '$stripeFee'] },
              adminCommision,
            ],
          },
        },
      },
    },
  ]);

  const lastMonthBoostEarningsAgg = await ArtistBoost.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$charge' },
      },
    },
  ]);

  const lastMonthEarnings =
    (lastMonthEarningsAgg[0]?.total || 0) +
    (lastMonthBoostEarningsAgg[0]?.total || 0);

  const totalAdminEarnings = currentMonthEarnings;

  // ---- New Users (last 3) ----
  const rawUsers = await Client.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .populate<{ auth: IAuth }>({
      path: 'auth',
      select: 'fullName email phoneNumber image',
    });

  const newUsers = rawUsers.map((u) => ({
    _id: u._id,
    fullName: u.auth?.fullName || '',
    email: u.auth?.email || '',
    phone: u.auth?.phoneNumber || '',
    image: u.auth?.image || '',
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
    { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'auths',
        localField: 'artist.auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    { $unwind: { path: '$auth', preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 0,
        fullName: '$auth.fullName',
        email: '$auth.email',
        type: '$artist.type',
        image: '$auth.image',
        phoneNumber: '$auth.phoneNumber',
      },
    },
  ]);

  // Calculate growth rates
  const clientGrowthRate = calculateGrowthRate(totalClients, lastMonthClients);
  const artistGrowthRate = calculateGrowthRate(totalArtists, lastMonthArtists);
  const businessGrowthRate = calculateGrowthRate(
    totalBusinesses,
    lastMonthBusinesses
  );
  const earningsGrowthRate = calculateGrowthRate(
    currentMonthEarnings,
    lastMonthEarnings
  );

  // // Get current year's data for charts
  // const currentYear = new Date().getFullYear();
  // const [appointmentSummary, totalRevenueStats] = await Promise.all([
  //   getYearlyAppointmentStats(currentYear),
  //   getYearlyRevenueStats(currentYear),
  // ]);

  return {
    stats: {
      totalClients: {
        count: totalClients,
        growthRate: clientGrowthRate,
        isPositive: parseFloat(clientGrowthRate) >= 0,
      },
      totalArtists: {
        count: totalArtists,
        growthRate: artistGrowthRate,
        isPositive: parseFloat(artistGrowthRate) >= 0,
      },
      totalBusinesses: {
        count: totalBusinesses,
        growthRate: businessGrowthRate,
        isPositive: parseFloat(businessGrowthRate) >= 0,
      },
      totalEarnings: {
        count: totalAdminEarnings,
        growthRate: earningsGrowthRate,
        isPositive: parseFloat(earningsGrowthRate) >= 0,
      },
    },
    newUsers,
    topArtists,
    // appointmentSummary,
    // totalRevenueStats,
  };
};

// getAllArtistsFoldersFromDB
const getAllArtistsFoldersFromDB = async () => {
  return await Folder.find();
};

// changeStatusOnFolder
// const changeStatusOnFolder = async (folderId: string, permission: boolean) => {
//   const folder = await Folder.findById(folderId);

//   if (!folder) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
//   }

//   if (permission) {
//     return await Folder.findByIdAndUpdate(
//       folderId,
//       { isPublished: true },
//       { new: true }
//     );
//   } else {
//     const deletedFolder = await Folder.findByIdAndDelete(folderId);

//     if (deletedFolder?.images?.length) {
//       await Promise.all(
//         deletedFolder.images.map((url) =>
//           typeof url === 'string' && url.includes('/upload/')
//             ? deleteImageFromCloudinary(url)
//             : Promise.resolve()
//         )
//       );
//     }

//     return deletedFolder;
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
  authDoc.isActive = !authDoc.isActive;
  await authDoc.save();
  return null;
};

// verifyBusinessByAdminIntoDB
const verifyBusinessByAdminIntoDB = async (businessId: string) => {
  const business = await Business.findById(businessId).populate('auth');

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const businessDoc = business.auth as any;
  businessDoc.isActive = !businessDoc.isActive;
  await businessDoc.save();
  return null;
};

// fetchAllClientsFromDB
const fetchAllClientsFromDB = async (query: Record<string, unknown>) => {
  const businessQuery = new QueryBuilder(
    Client.find().populate([
      {
        path: 'auth',
        select: 'fullName image email phoneNumber isProfile isActive',
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

// fetchAllArtistsFromDB
const fetchAllArtistsFromDB = async (query: Record<string, unknown>) => {
  const artistQuery = new QueryBuilder(
    Artist.find().populate([
      {
        path: 'auth',
        select: 'fullName image email phoneNumber isProfile isActive',
      },
    ]),
    query
  )
    // .search(['type', 'expertise', 'city'])
    .search(['type', 'expertise', 'stringLocation'])
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
        select: 'fullName image email phoneNumber isProfile isActive',
      },
    ]),
    query
  )
    .search([
      // 'city',
      'stringLocation',
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

// fetchAllSecretReviewsFromDB
const fetchAllSecretReviewsFromDB = async (query: Record<string, unknown>) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const normalizedSearchTerm =
    typeof searchTerm === 'string' ? searchTerm.trim() : '';

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
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

    // join artist
    {
      $lookup: {
        from: 'artists',
        localField: 'service.artist',
        foreignField: '_id',
        as: 'artist',
      },
    },
    { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },

    // join auth
    {
      $lookup: {
        from: 'auths',
        localField: 'artist.auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    { $unwind: { path: '$auth', preserveNullAndEmptyArrays: true } },

    // join booking
    {
      $lookup: {
        from: 'bookings',
        localField: 'booking',
        foreignField: '_id',
        as: 'booking',
      },
    },
    { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },

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
        artistStringLocation: '$artist.stringLocation',

        artistEmail: '$auth.email',
        artistFullName: '$auth.fullName',
        artistPhone: '$auth.phoneNumber',
        artistImage: '$auth.image',

        bookingDate: '$booking.createdAt',
        bookingBodyPart: '$booking.bodyPart',
        bookingPaymentStatus: '$booking.paymentStatus',
        bookingReview: '$booking.review',
        bookingRating: '$booking.rating',

        // booking client info
        bookingClientFullName: '$booking.clientInfo.fullName',
        bookingClientEmail: '$booking.clientInfo.email',
        bookingClientPhone: '$booking.clientInfo.phone',
      },
    },
  ];

  // Search across all fields
  if (
    normalizedSearchTerm &&
    normalizedSearchTerm !== 'undefined' &&
    normalizedSearchTerm !== 'null'
  ) {
    pipeline.push({
      $match: {
        $or: [
          { description: { $regex: normalizedSearchTerm, $options: 'i' } },
          { serviceTitle: { $regex: normalizedSearchTerm, $options: 'i' } },
          { artistEmail: { $regex: normalizedSearchTerm, $options: 'i' } },
          { artistFullName: { $regex: normalizedSearchTerm, $options: 'i' } },
          { artistPhone: { $regex: normalizedSearchTerm, $options: 'i' } },
          { bookingReview: { $regex: normalizedSearchTerm, $options: 'i' } },
          { bookingLocation: { $regex: normalizedSearchTerm, $options: 'i' } },
          { bookingBodyPart: { $regex: normalizedSearchTerm, $options: 'i' } },
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
      $lookup: {
        from: 'clients',
        localField: 'client',
        foreignField: '_id',
        as: 'client',
      },
    },
    { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'auths',
        localField: 'client.auth',
        foreignField: '_id',
        as: 'clientAuth',
      },
    },
    { $unwind: { path: '$clientAuth', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'artists',
        localField: 'artist',
        foreignField: '_id',
        as: 'artist',
      },
    },
    { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'auths',
        localField: 'artist.auth',
        foreignField: '_id',
        as: 'artistAuth',
      },
    },
    { $unwind: { path: '$artistAuth', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        serviceName: 1,
        status: 1,
        paymentStatus: 1,
        createdAt: 1,
        'clientInfo.fullName': 1,
        'clientInfo.phone': 1,
        'clientInfo.image': '$clientAuth.image',
        'artistInfo.fullName': 1,
        'artistInfo.phone': 1,
        'artistInfo.image': '$artistAuth.image',
        price: 1,
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
  const total = result[0]?.totalCount[0]?.count || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result[0]?.data || [],
  };
};

const getAllServicesForAdminIntoDb = async (query: {
  page?: number;
  limit?: number;
  searchTerm?: string;
}) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const matchStage: Record<string, unknown> = {
    isDeleted: false,
  };

  if (query.searchTerm) {
    matchStage.$or = [
      { title: { $regex: query.searchTerm, $options: 'i' } },
      { description: { $regex: query.searchTerm, $options: 'i' } },
      { bodyLocation: { $regex: query.searchTerm, $options: 'i' } },
      { price: { $regex: query.searchTerm, $options: 'i' } },
      { avgRating: { $regex: query.searchTerm, $options: 'i' } },
    ];
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'artists',
        localField: 'artist',
        foreignField: '_id',
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
    { $sort: { createdAt: -1 } },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        bodyLocation: 1,
        sessionType: 1,
        price: 1,
        avgRating: 1,
        totalCompletedOrder: 1,
        totalReviewCount: 1,
        createdAt: 1,

        artist: {
          _id: '$artistInfo._id',
          fullName: '$artistAuth.fullName',
          email: '$artistAuth.email',
          phoneNumber: '$artistAuth.phoneNumber',
          image: '$artistAuth.image',
        },
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await Service.aggregate(pipeline);
  const total = result[0]?.totalCount[0]?.count || 0;
  return {
    data: result[0]?.data || [],
    meta: {
      page,
      limit,
      total: total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const blockUnblockAnyUserIntoDB = async (userAuthId: string) => {
  const user = await Auth.findById(userAuthId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  user.isActive = !user.isActive;
  await user.save();
  return null;
};

export const AdminService = {
  fetchDasboardPageData,
  getYearlyRevenueStats,
  getYearlyAppointmentStats,
  getAllArtistsFoldersFromDB,
  // changeStatusOnFolder,
  verifyArtistByAdminIntoDB,
  verifyBusinessByAdminIntoDB,
  fetchAllClientsFromDB,
  fetchAllArtistsFromDB,
  fetchAllBusinessesFromDB,
  fetchAllSecretReviewsFromDB,
  getAllBookingsForAdminIntoDb,
  getAllServicesForAdminIntoDb,
  blockUnblockAnyUserIntoDB,
};

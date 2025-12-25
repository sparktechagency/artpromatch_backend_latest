/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { startSession, Types } from 'mongoose';
import { AppError } from '../../utils';
import ArtistPreferences from '../ArtistPreferences/artistPreferences.model';
import { IAuth } from '../Auth/auth.interface';
import Auth from '../Auth/auth.model';
import {
  IService,
  TServiceImages,
  TServicePayload,
} from '../Service/service.interface';
import Artist from './artist.model';
import {
  TUpdateArtistNotificationPayload,
  TUpdateArtistPayload,
  TUpdateArtistPreferencesPayload,
  TUpdateArtistPrivacySecurityPayload,
  TUpdateArtistProfilePayload,
} from './artist.validation';

import { JwtPayload } from 'jsonwebtoken';
import Stripe from 'stripe';
import config from '../../config';
import { deleteImageFromCloudinary } from '../../utils/deleteImageFromCloudinary';

import { uploadToCloudinary } from '../../utils/uploadFileToCloudinary';
import { ROLE } from '../Auth/auth.constant';
import { BOOKING_STATUS } from '../Booking/booking.constant';
import Booking from '../Booking/booking.model';
import { ArtistBoost } from '../BoostProfile/boost.profile.model';
import Business from '../Business/business.model';
import Folder from '../Folder/folder.model';
import GuestSpot from '../GuestSpot/guestSpot.model';
import Notification from '../notificationModule/notification.model';
import Service from '../Service/service.model';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);

// getAllArtistsFromDB
const getAllArtistsFromDB = async (query: Record<string, any>, user: IAuth) => {
  // Step 1: Logged-in artist location check
  let [lon, lat] = [0, 0];

  if (user.role === ROLE.ARTIST) {
    const loggedInArtist = await Artist.findOne({ auth: user._id });

    if (!loggedInArtist || !loggedInArtist.currentLocation) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Logged in artist location not found!'
      );
    }

    [lon, lat] = loggedInArtist.currentLocation.coordinates;
  } else if (user.role === ROLE.BUSINESS) {
    const loggedInArtist = await Business.findOne({ auth: user._id });

    if (!loggedInArtist || !loggedInArtist.location) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Logged in business location not found!'
      );
    }

    [lon, lat] = loggedInArtist.location.coordinates;
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filter artists with valid coordinates first, excluding logged-in artist
  // const artistsWithLocation = await Artist.find({
  //   'currentLocation.coordinates.0': { $exists: true },
  //   'currentLocation.coordinates.1': { $exists: true },
  //   auth: { $ne: userData._id }, // exclude logged-in artist
  // }).countDocuments();

  // Step 2: Base search filter
  const searchFilter: Record<string, any> = {
    'currentLocation.coordinates.0': { $exists: true },
    'currentLocation.coordinates.1': { $exists: true },
    // auth: { $ne: userData._id }, // exclude logged-in artist
  };

  // Step 3: Artist Type Filter
  if (query.artistType && query.artistType !== 'All') {
    searchFilter.type = {
      $regex: query.artistType,
      $options: 'i',
    };
  }

  // Step 4: Tattoo Category Filter (Expertise)
  if (query.tattooCategory && query.tattooCategory !== 'All') {
    searchFilter.expertise = {
      $elemMatch: {
        $regex: query.tattooCategory,
        $options: 'i',
      },
    };
  }

  // Step 5: SearchTerm Filter (stringLocation, expertise, fullName)
  if (query.searchTerm && query.searchTerm.trim()) {
    const regex = new RegExp(query.searchTerm, 'i');
    searchFilter.$or = [
      { stringLocation: regex },
      { expertise: { $elemMatch: { $regex: regex } } },
      { type: regex },
    ];
  }

  // Step 6: Get total count (for pagination)
  const total = await Artist.countDocuments(searchFilter);

  // Step 7: Geo aggregation
  const artists = await Artist.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lon, lat] },
        distanceField: 'distance', // distance in meters
        spherical: true,
        query: searchFilter, // nice to use
      },
    },
    {
      $lookup: {
        from: 'auths',
        localField: 'auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    { $unwind: { path: '$auth', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        expertise: 1,
        currentLocation: 1,
        type: 1,
        stringLocation: 1,
        distance: 1,
        avgRating: 1,
        totalReviewCount: 1,
        hourlyRate: 1,
        totalCompletedService: 1,
        // Only these fields from auth
        'auth._id': 1,
        'auth.fullName': 1,
        'auth.phoneNumber': 1,
        'auth.email': 1,
        'auth.image': 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  // Step 8: Meta
  const totalPage = Math.ceil(total / limit);

  return {
    data: artists,
    meta: {
      total,
      totalPage,
      limit,
      page,
    },
  };
};

// getOwnArtistDataFromDB
const getOwnArtistDataFromDB = async (userData: IAuth) => {
  const artist = await Artist.findOne({ auth: userData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const services = await Service.find({ artist: artist._id }).lean();

  return { artist, services };
};

// getSingleArtistFromDB
const getSingleArtistFromDB = async (artistId: string) => {
  const artist = await Artist.findById(artistId);

  if (!artist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Logged in artist location not found!'
    );
  }

  return artist;
};

// update artist person info into db
const updateArtistPersonalInfoIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPayload
) => {
  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  await ArtistPreferences.findOneAndUpdate({ artistId: artist._id }, payload, {
    new: true,
  });

  return await Artist.findOneAndUpdate({ auth: user._id }, payload, {
    new: true,
  }).populate('preferences');
};

// updateArtistProfileIntoDB
const updateArtistProfileIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistProfilePayload
) => {
  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const updatedArtist = await Auth.findByIdAndUpdate(user._id, payload);

  if (!updatedArtist?.isModified) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update artist!');
  }

  const result = await Artist.findOne({ auth: user._id })
    .select('_id')
    .populate({
      path: 'auth',
      select: 'fullName',
    });

  return result;
};

// updateArtistPreferencesIntoDB
const updateArtistPreferencesIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPreferencesPayload
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// updateArtistNotificationPreferencesIntoDB
const updateArtistNotificationPreferencesIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistNotificationPayload
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// updateArtistPrivacySecuritySettingsIntoDB
const updateArtistPrivacySecuritySettingsIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPrivacySecurityPayload
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// updateArtistFlashesIntoDB
const updateArtistFlashesIntoDB = async (
  user: IAuth,
  files: Express.Multer.File[] | undefined
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required!');
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadToCloudinary(file, 'folder_images'))
  );

  const flashUrls = uploaded.map((u) => u.secure_url);

  try {
    return await Artist.findByIdAndUpdate(
      artist._id,
      {
        $push: {
          flashes: { $each: flashUrls },
        },
      },
      { new: true }
    );
  } catch (err) {
    await Promise.all(flashUrls.map((url) => deleteImageFromCloudinary(url)));
    throw err;
  }
};

// updateArtistPortfolioIntoDB
const updateArtistPortfolioIntoDB = async (
  user: IAuth,
  files: Express.Multer.File[] | undefined
) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // if (!artist.isVerifiedByOTP) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not verified');
  // }

  // if (!artist.isActive) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not activated by admin yet');
  // }

  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required');
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadToCloudinary(file, 'folder_images'))
  );

  const portfolioUrls = uploaded.map((u) => u.secure_url);

  try {
    return await Artist.findByIdAndUpdate(
      artist._id,
      {
        $push: {
          portfolio: {
            $each: portfolioUrls,
          },
        },
      },
      { new: true }
    );
  } catch (err) {
    await Promise.all(
      portfolioUrls.map((url) => deleteImageFromCloudinary(url))
    );
    throw err;
  }
};

// getServicesByArtistFromDB
const getServicesByArtistFromDB = async (user: IAuth) => {
  const artist = await Artist.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const result = await Service.aggregate([
    { $match: { artist: artist._id } },

    {
      $project: {
        avgRating: 1,
        bodyLocation: 1,
        description: 1,
        images: 1,
        price: 1,
        sessionType: 1,
        thumbnail: 1,
        title: 1,
        // totalCompletedOrder: 1,
        // totalReviewCount: 1,
        _id: 1,
      },
    },
  ]);

  return result;
};

const getServiceDetailsFromDB = async (user: IAuth, serviceId: string) => {
  const artist = await Artist.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const result = await Service.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(serviceId),
        artist: artist._id,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        price: 1,
        sessionType: 1,
        bodyLocation: 1,
        totalCompletedOrder: 1,
        totalReviewCount: 1,
        thumbnail: 1,
        images: 1,
        avgRating: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!result.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
  }

  return result[0];
};

// updateArtistServiceByIdIntoDB
const updateArtistServiceByIdIntoDB = async (
  id: string,
  payload: Partial<IService>,
  files: TServiceImages,
  UserData: IAuth
) => {
  const artist = await Artist.findOne({ auth: UserData._id });
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist account not found!');
  }

  const service = await Service.findOne({ _id: id, artist: artist._id });
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
  }

  /* -------------------- THUMBNAIL -------------------- */
  let thumbnail = service.thumbnail;

  if (files?.thumbnail?.length) {
    const thumbResult = await uploadToCloudinary(
      files.thumbnail[0],
      'services_images'
    );

    await deleteImageFromCloudinary(service.thumbnail);
    thumbnail = thumbResult.secure_url;
  }

  /* -------------------- IMAGES -------------------- */

  // Images frontend wants to keep
  const keptImages: string[] = payload.images || [];

  // Images removed by frontend
  const removedImages = service.images.filter(
    (img) => !keptImages.includes(img)
  );

  // Delete removed images from Cloudinary
  if (removedImages.length) {
    await Promise.all(
      removedImages.map((img) => deleteImageFromCloudinary(img))
    );
  }

  // Upload new images
  let uploadedImages: string[] = [];
  if (files?.images?.length) {
    const uploads = await Promise.all(
      files.images.map((file) => uploadToCloudinary(file, 'services_images'))
    );

    uploadedImages = uploads.map((img: any) => img.secure_url);
  }

  // Final images list
  const images = [...keptImages, ...uploadedImages];

  /* -------------------- UPDATE -------------------- */
  const result = await Service.findByIdAndUpdate(
    id,
    {
      ...payload,
      thumbnail,
      images,
    },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update service!');
  }

  return result;
};

// deleteArtistServiceFromDB
const deleteArtistServiceFromDB = async (id: string, UserData: IAuth) => {
  const artist = await Artist.findOne({ auth: UserData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist account not found!');
  }

  const serviceExists = await Service.findOne({ _id: id, artist: artist._id });

  if (!serviceExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
  }

  const bookedServiceExists = await Booking.exists({
    service: serviceExists._id,
    status: {
      $in: [
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.PROGRESS,
        BOOKING_STATUS.READY_FOR_COMPLETION,
      ],
    },
  });

  if (bookedServiceExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This service is already booked, so it cannot be deleted!'
    );
  }

  await Service.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  return null;
};

// removeImageFromDB
const removeImageFromDB = async (user: IAuth, filePath: string) => {
  const artist = await Artist.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // Remove the image file path from the 'flashes' array
  const updatedArtist = await Artist.findByIdAndUpdate(
    artist._id,
    {
      $pull: {
        flashes: filePath,
        portfolio: filePath,
      },
    },
    { new: true }
  );

  if (!updatedArtist) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to remove flash image'
    );
  }

  if (typeof filePath === 'string' && filePath.includes('/upload/')) {
    await deleteImageFromCloudinary(filePath);
  }

  return updatedArtist;
};

const getArtistMonthlySchedule = async (
  user: IAuth,
  year: number,
  month: number
) => {
  // Month boundaries

  const artist = await Artist.findOne({ auth: user.id }, '_id');
  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');
  const startOfMonth = new Date(year, month - 1, 1); // 2025-05-01
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // 2025-05-31

  const result = await Booking.aggregate([
    // 1. Filter artist bookings with valid status and sessions in month
    {
      $match: {
        artist: new Types.ObjectId(artist._id),
        status: { $in: ['confirmed', 'in_progress', 'ready_for_completion'] },
        'sessions.date': { $gte: startOfMonth, $lte: endOfMonth },
      },
    },

    // 2. Only keep necessary fields
    {
      $project: {
        _id: 1,
        clientInfo: { fullName: 1, phone: 1, email: 1 },
        service: 1,
        sessions: 1,
      },
    },

    // 3. Unwind sessions
    { $unwind: { path: '$sessions', preserveNullAndEmptyArrays: true } },

    // 4. Match only sessions within month
    {
      $match: {
        'sessions.date': { $gte: startOfMonth, $lte: endOfMonth },
      },
    },

    // 5. Lookup service info
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        pipeline: [{ $project: { _id: 1, title: 1 } }],
        as: 'service',
      },
    },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

    // 6. Project only needed fields per session
    {
      $project: {
        bookingId: '$_id',
        sessionId: '$sessions._id',
        date: '$sessions.date',
        startTime: '$sessions.startTime',
        endTime: '$sessions.endTime',
        status: '$sessions.status',
        service: { _id: '$service._id', name: '$service.title' },
        client: '$clientInfo',
      },
    },

    // 7. Group by day
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        sessions: { $push: '$$ROOT' },
      },
    },

    // 8. Sort by date
    { $sort: { _id: 1 } },
  ]);

  // Convert _id to date key
  const grouped: Record<string, any[]> = {};
  result.forEach((day) => {
    grouped[day._id] = day.sessions;
  });

  return grouped;
};

// createConnectedAccountAndOnboardingLinkForArtistIntoDb
const createConnectedAccountAndOnboardingLinkForArtistIntoDb = async (
  userData: JwtPayload
) => {
  // Step 1: Find Artist
  const artist = await Artist.findOne(
    { auth: userData._id },
    { _id: 1, stripeAccountId: 1, isStripeReady: 1, auth: 1 }
  ).populate('auth');

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found or restricted.');
  }

  if (artist.stripeAccountId && artist.isStripeReady) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Stripe already connected!');
  }

  // Step 2: If Stripe account exists but not ready yet
  if (artist.stripeAccountId && !artist.isStripeReady) {
    const account = await stripe.accounts.retrieve(artist.stripeAccountId);

    const isStripeFullyOk =
      account?.capabilities?.card_payments === 'active' &&
      account?.capabilities?.transfers === 'active';

    if (isStripeFullyOk) {
      // Mark artist as Stripe ready
      artist.isStripeReady = true;
      await artist.save();

      return null; // Already ready, no need for onboarding link
    }

    // Generate new onboarding link for existing account
    const onboardingData = await stripe.accountLinks.create({
      account: artist.stripeAccountId,
      refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${artist.stripeAccountId}`,
      return_url: config.stripe.onboarding_return_url,
      type: 'account_onboarding',
    });

    return onboardingData.url;
  }

  // Step 3: If no Stripe account, create a new one
  if (!artist.stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: (artist?.auth as any)?.email,
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      settings: {
        payouts: { schedule: { interval: 'manual' } },
      },
    });

    const onboardingData = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${account.id}`,
      return_url: config.stripe.onboarding_return_url,
      type: 'account_onboarding',
    });

    const updatedArtist = await Artist.findByIdAndUpdate(
      artist._id,
      { $set: { stripeAccountId: account.id, isStripeReady: false } },
      { new: true }
    );

    if (!updatedArtist) {
      await stripe.accounts.del(account.id); // cleanup

      throw new AppError(
        httpStatus.NOT_EXTENDED,
        'Failed to save Stripe account ID into DB!'
      );
    }

    return onboardingData.url;
  }

  return null; // Fallback
};

// create service
const createArtistServiceIntoDB = async (
  user: IAuth,
  payload: TServicePayload,
  files: TServiceImages
): Promise<IService> => {
  const artist = await Artist.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  if (!artist.stripeAccountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe account not created yet!'
    );
  }

  if (artist.stripeAccountId && !artist.isStripeReady) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe account exists but not ready to create service yet!'
    );
  }

  // Upload gallery images (multiple)
  const gallery = await Promise.all(
    files.images.map((file) => uploadToCloudinary(file, 'services_images'))
  );

  const images = gallery.map((res) => res.secure_url);

  // Upload thumbnail (single)
  let thumbnail = null;
  if (files.thumbnail?.[0]) {
    const thumbResult = await uploadToCloudinary(
      files.thumbnail[0],
      'services_thumbnail'
    );
    thumbnail = thumbResult.secure_url;
  }

  // Save to database
  const serviceData = {
    ...payload,
    artist: artist._id,
    thumbnail,
    images,
  };

  const service = await Service.create(serviceData);
  if (!service) {
    if (thumbnail) {
      await deleteImageFromCloudinary(thumbnail as string);
    }
    if (images.length > 0) {
      images?.map(async (image) => await deleteImageFromCloudinary(image));
    }
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to create service")
  }

  return service;
};

// boostProfileIntoDb
const boostProfileIntoDb = async (user: IAuth) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const artist = await Artist.findOne({ auth: user.id }, '_id boost').session(
      session
    );

    if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');

    if (artist.boost.endTime && artist.boost.endTime > new Date()) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Profile is already boosted');
    }

    const boost = await ArtistBoost.create(
      [
        {
          artist: artist._id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
          paymentStatus: 'pending',
          charge: Number(config.boost_charge),
        },
      ],
      { session }
    );

    // create checkout session
    const checkoutSession: any = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Profile Boost' },
              unit_amount: Math.round(Number(config.boost_charge) * 100),
            },
            quantity: 1,
          },
        ],
        expand: ['payment_intent'],
        metadata: {
          boostId: boost[0]?._id?.toString(),
          artistId: artist._id.toString(),
        },
        success_url: `${config.client_url}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.client_url}/boost/cancel`,
      },
      { idempotencyKey: `boost_${boost[0].id.toString()}` }
    );

    await session.commitTransaction();
    session.endSession();

    return checkoutSession.url;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// confirm boost payment
const confirmBoostPaymentIntoDb = async (sessionId: string) => {
  const chSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });

  const boostId = chSession.metadata?.boostId as string | undefined;

  if (!boostId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Boost ID not found in metadata!'
    );
  }

  const boost = await ArtistBoost.findById(boostId);

  if (!boost) {
    throw new AppError(httpStatus.NOT_FOUND, 'Boost record not found');
  }

  // If already succeeded, just return current state
  // if (boost.paymentStatus === 'succeeded') {
  //   return boost;
  // }

  const paymentIntent = chSession.payment_intent;

  const paymentIntentId =
    typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id ?? '';

  if (!paymentIntentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment intent not found for this session!'
    );
  }

  // Mark boost as succeeded & active
  boost.paymentStatus = 'succeeded';
  boost.paymentIntentId = paymentIntentId;
  boost.isActive = true;
  await boost.save();

  // Update artist.boost flags
  await Artist.findByIdAndUpdate(boost.artist, {
    'boost.isActive': true,
    'boost.startTime': boost.startTime,
    'boost.endTime': boost.endTime,
  });

  return boost;
};

// getArtistProfileByHisIdFromDB
const getArtistProfileByHisIdFromDB = async (artistId: string) => {
  const artist = await Artist.findById(artistId).populate([
    {
      path: 'auth',
      select: 'fullName image email phoneNumber isProfile isSocialLogin',
    },
  ]);

  const preference = await ArtistPreferences.findOne({
    artistId: artist?._id,
  }).select('-artistId -updatedAt -createdAt');

  // Get active services
  const activeServices = await Service.find({
    artist: artist?._id,
    isDeleted: false,
  })
    .select(
      'title thumbnail price avgRating totalReviewCount totalCompletedOrder bodyLocation sessionType'
    )
    .lean();

  // Get active guest spots
  const now = new Date();
  const activeGuestSpots = await GuestSpot.find({
    artist: artist?._id,
    isActive: true,
    $or: [{ endDate: { $gte: now } }, { 'location.until': { $gte: now } }],
  })
    .select('location startDate endDate startTime endTime offDays')
    .lean();

  const activeFolders = await Folder.find({
    owner: artist?.auth,
    isPublished: true,
  })
    .select('name for images -_id')
    .lean();

  return {
    ...artist?.toObject(),
    preference,
    activeServices,
    activeGuestSpots,
    activeFolders,
  };
};

// expire boost
export const expireBoosts = async () => {
  const now = new Date();

  // find boosts that are still active and past endTime
  const expiredBoosts = await ArtistBoost.find({
    endTime: { $lte: now },
    isActive: true,
  });

  if (expiredBoosts.length === 0) return; // nothing to do

  for (const boost of expiredBoosts) {
    await ArtistBoost.findByIdAndUpdate(boost._id, {
      isActive: false,
    });

    // update the artist's boost info
    await Artist.findByIdAndUpdate(boost.artist, {
      'boost.isActive': false,
      'boost.endTime': boost.endTime,
    });
  }
};

// expire guest locations (reset artists back to mainLocation when guest spot time is over)
export const expireGuestLocations = async () => {
  const now = new Date();

  const artists = await Artist.find({
    'currentLocation.currentLocationUntil': { $ne: null, $lte: now },
  });

  if (artists.length === 0) return; // nothing to do

  for (const artist of artists) {
    // reset currentLocation to mainLocation and clear expiry using direct update

    await Artist.updateOne(
      { _id: artist._id },
      {
        $set: {
          'currentLocation.coordinates': artist.mainLocation.coordinates,
          'currentLocation.currentLocationUntil': null,
        },
      }
    );
  }
};

// getArtistDashboardPage
const getArtistDashboardPage = async (user: IAuth) => {
  const artist = await Artist.findOne({ auth: user.id }).select('_id');
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');
  }

  // Step 2: aggregate booking stats for this artist
  const [bookingStats] = await Booking.aggregate([
    {
      $match: {
        artist: artist._id,
      },
    },
    {
      $group: {
        _id: null,
        pendingBooking: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        currentBooking: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
        completedOrder: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        artistEarning: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$artistEarning', 0],
          },
        },
      },
    },
  ]);

  const totalServices = await Service.countDocuments({ artist: artist._id });

  const latestBookings = await Booking.find({
    artist: artist._id,
    status: 'pending',
  })
    .select('clientInfo.fullName createdAt serviceName') // only include client's fullName
    .sort({ createdAt: -1 })
    .limit(2)
    .lean(); // <-- returns plain JSON instead of mongoose docs

  // reshape result
  const latestBookingRequest = latestBookings.map((b) => ({
    _id: b._id,
    FullName: b.clientInfo?.fullName || null,
    serviceName: b.serviceName,
    image: user.image,
    createdAt: b.createdAt,
  }));

  // Step 5: latest 2 notifications for artist
  const latestNotificationsRaw = await Notification.find({
    receiver: user.id,
  })
    .select('type createdAt receiver')
    .populate<{ receiver: IAuth }>('receiver', 'fullName')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

  const latestNotifications = latestNotificationsRaw.map((n) => ({
    _id: n._id,
    type: n.type,
    createdAt: n.createdAt,
    receiverName: n.receiver?.fullName || null,
  }));
  // Step 4: final response
  return {
    pendingBooking: bookingStats?.pendingBooking || 0,
    currentBooking: bookingStats?.currentBooking || 0,
    completedOrder: bookingStats?.completedOrder || 0,
    artistEarning: bookingStats?.artistEarning || 0,
    totalService: totalServices,
    latestBookingRequest: latestBookingRequest,
    latestNotifications: latestNotifications,
  };
};

export const ArtistService = {
  getAllArtistsFromDB,
  getOwnArtistDataFromDB,
  getSingleArtistFromDB,
  updateArtistPersonalInfoIntoDB,
  updateArtistProfileIntoDB,
  updateArtistPreferencesIntoDB,
  updateArtistNotificationPreferencesIntoDB,
  updateArtistPrivacySecuritySettingsIntoDB,
  updateArtistFlashesIntoDB,
  updateArtistPortfolioIntoDB,
  getServiceDetailsFromDB,
  getArtistMonthlySchedule,
  boostProfileIntoDb,
  confirmBoostPaymentIntoDb,
  getArtistProfileByHisIdFromDB,
  getArtistDashboardPage,
  getServicesByArtistFromDB,
  updateArtistServiceByIdIntoDB,
  deleteArtistServiceFromDB,
  removeImageFromDB,
  createConnectedAccountAndOnboardingLinkForArtistIntoDb,
  createArtistServiceIntoDB,
};

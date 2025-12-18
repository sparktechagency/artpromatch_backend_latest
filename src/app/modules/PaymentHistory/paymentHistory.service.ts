import httpStatus from 'http-status';
import { AppError } from '../../utils';
import QueryBuilder from '../../builders/QueryBuilder';
import Booking from '../Booking/booking.model';
import Client from '../Client/client.model';
import Artist from '../Artist/artist.model';
import { IAuth } from '../Auth/auth.interface';
import { ROLE } from '../Auth/auth.constant';

// getAllPaymentsForClientAndArtistFromDB
const getAllPaymentsForClientAndArtistFromDB = async (
  query: Record<string, unknown>,
  userData: IAuth
) => {
  const match: Record<string, unknown> = {};

  if (userData.role === ROLE.CLIENT) {
    const client = await Client.findOne({ auth: userData._id }, '_id');

    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
    }

    match.client = client._id;
  } else if (userData.role === ROLE.ARTIST) {
    const artist = await Artist.findOne({ auth: userData._id }, '_id');

    if (!artist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Artist profile not found');
    }

    match.artist = artist._id;
  }

  const bookingQuery = new QueryBuilder(
    Booking.find(match).select(
      'serviceName price status paymentStatus stripeFee platFormFee artistEarning clientInfo artistInfo createdAt'
    ),
    query
  )
    .search([
      'serviceName',
      'clientInfo.fullName',
      'clientInfo.email',
      'clientInfo.phone',
      'artistInfo.fullName',
      'artistInfo.email',
      'artistInfo.phone',
      'status',
      'paymentStatus',
    ])
    .filter()
    .sort()
    .paginate();

  const data = await bookingQuery.modelQuery;
  const meta = await bookingQuery.countTotal();

  return { data, meta };
};

// getAllPaymentsForAdminFromDB
const getAllPaymentsForAdminFromDB = async (query: Record<string, unknown>) => {
  const bookingQuery = new QueryBuilder(
    Booking.find()
      .select(
        'serviceName price status paymentStatus stripeFee platFormFee artistEarning clientInfo artistInfo createdAt client artist'
      )
      .populate([
        {
          path: 'client',
          select: 'auth',
          populate: { path: 'auth', select: 'image' },
        },
        {
          path: 'artist',
          select: 'auth',
          populate: { path: 'auth', select: 'image' },
        },
      ]),
    query
  )
    .search([
      'serviceName',
      'clientInfo.fullName',
      'clientInfo.email',
      'clientInfo.phone',
      'artistInfo.fullName',
      'artistInfo.email',
      'artistInfo.phone',
      'status',
      'paymentStatus',
    ])
    .filter()
    .sort()
    .paginate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData: any[] = await bookingQuery.modelQuery;
  const data = rawData.map((doc) => {
    const d = typeof doc?.toObject === 'function' ? doc.toObject() : doc;

    const clientImage = d?.client?.auth?.image;
    const artistImage = d?.artist?.auth?.image;

    if (d?.clientInfo && clientImage) {
      d.clientInfo.image = clientImage;
    }

    if (d?.artistInfo && artistImage) {
      d.artistInfo.image = artistImage;
    }

    delete d.client;
    delete d.artist;

    return d;
  });
  const meta = await bookingQuery.countTotal();

  return { data, meta };
};

export const PaymentHistoryService = {
  getAllPaymentsForClientAndArtistFromDB,
  getAllPaymentsForAdminFromDB,
};

import httpStatus from 'http-status';
import { AppError } from '../../utils';
import Folder from '../Folder/folder.model';
import fs from 'fs';
import Artist from '../Artist/artist.model';
import Business from '../Business/business.model';
import Client from '../Client/client.model';
import QueryBuilder from 'mongoose-query-builders';

const getArtistFolders = async () => {
  return await Folder.find({ isPublished: false });
};

const changeStatusOnFolder = async (folderId: string, permission: boolean) => {
  const folder = await Folder.findById(folderId);

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found');
  }

  const artist = await Artist.findOne({ auth: folder.auth });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');
  }

  if (permission) {
    if (folder.for === 'portfolio') {
      await Artist.findByIdAndUpdate(artist?._id, {
        $addToSet: {
          portfolio: {
            folder: folder._id,
            position: artist?.portfolio?.length + 1,
          },
        },
      });
      return await Folder.findByIdAndUpdate(folderId, {
        isPublished: true,
      });
    } else if (folder.for === 'flash') {
      await Artist.findByIdAndUpdate(artist?._id, {
        $addToSet: {
          flashes: {
            folder: folder._id,
            position: artist?.flashes?.length + 1,
          },
        },
      });
      return await Folder.findByIdAndUpdate(folderId, {
        isPublished: true,
      });
    }
  } else {
    const deletedFolder = await Folder.findByIdAndDelete(folderId);
    deletedFolder?.images?.forEach((path) => fs.unlink(path, () => {}));
  }
};

const verifiedArtistByAdminIntoDB = async (artistId: string) => {
  const result = await Artist.findByIdAndUpdate(
    artistId,
    { isActive: true },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');
  }

  return result;
};

const verifiedBusinessByAdminIntoDB = async (businessId: string) => {
  const result = await Business.findByIdAndUpdate(
    businessId,
    { isActive: true },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'business not found');
  }

  return result;
};

const fetchAllArtists = async (query: Record<string, unknown>) => {
  const artistQuery = new QueryBuilder(
    Artist.find({}).populate([
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

const fetchAllBusiness = async (query: Record<string, unknown>) => {
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

const fetchAllClient = async (query: Record<string, unknown>) => {
  const businessQuery = new QueryBuilder(
    Client.find({}).populate([
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

export const AdminService = {
  getArtistFolders,
  changeStatusOnFolder,
  verifiedArtistByAdminIntoDB,
  verifiedBusinessByAdminIntoDB,
  fetchAllArtists,
  fetchAllBusiness,
  fetchAllClient,
};

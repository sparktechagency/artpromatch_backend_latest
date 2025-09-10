import httpStatus from 'http-status';
import { AppError } from '../../utils';
import Folder from '../Folder/folder.model';
import fs from 'fs';
import Artist from '../Artist/artist.model';
import Business from '../Business/business.model';
import Client from '../Client/client.model';
import QueryBuilder from 'mongoose-query-builders';

// getAllArtistsFoldersFromDB
const getAllArtistsFoldersFromDB = async () => {
  return await Folder.find({ isPublished: false });
};

// changeStatusOnFolder
const changeStatusOnFolder = async (folderId: string, permission: boolean) => {
  const folder = await Folder.findById(folderId);

  if (!folder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder not found!');
  }

  const artist = await Artist.findOne({ auth: folder.auth });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
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

export const AdminService = {
  getAllArtistsFoldersFromDB,
  changeStatusOnFolder,
  verifyArtistByAdminIntoDB,
  verifyBusinessByAdminIntoDB,
  fetchAllArtistsFromDB,
  fetchAllBusinessesFromDB,
  fetchAllClientsFromDB,
};

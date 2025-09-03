import httpStatus from 'http-status';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import { AppError } from '../utils';

type TAuthUser = {
  id: string;
  fullName: string;
  image: string;
  email: string;
  role: string;
};

export const createAccessToken = (payload: TAuthUser): string => {
  const token = jwt.sign(payload, config.jwt.access_secret!, {
    algorithm: 'HS256',
    expiresIn: config.jwt.access_expires_in!,
  } as SignOptions);

  return token;
};

export const createRefreshToken = (payload: TAuthUser): string => {
  const token = jwt.sign(payload, config.jwt.refresh_secret!, {
    algorithm: 'HS256',
    expiresIn: config.jwt.refresh_expires_in!,
  } as SignOptions);

  return token;
};

export interface ITokenUser {
  id: string;
  fullName: string;
  image: string;
  email: string;
  role: string;
}

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.access_secret as string
    ) as ITokenUser;

    return decoded;
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access!');
  }
};

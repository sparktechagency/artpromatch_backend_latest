import { Socket } from 'socket.io';
import httpStatus from 'http-status';
import { AppError } from '../utils';
import { JwtPayload } from 'jsonwebtoken';
import Auth from '../modules/Auth/auth.model';
import { verifyToken } from '../lib';
import config from '../config';

// import { NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const socketAuth = async (socket: Socket, next: any) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
    }

    // Remove Bearer from token if present
    const cleanToken = token.replace('Bearer ', '');

    const verifiedUser = verifyToken(
      cleanToken,
      config.jwt.access_secret!
    ) as JwtPayload;

    const user = await Auth.findById(verifiedUser.id).select('-password');

    if (!user || user === null) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    if (user?._id) {
      socket.join(user?._id.toString());
    }

    // Attach user to socket
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
};

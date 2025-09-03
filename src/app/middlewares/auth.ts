import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { AppError, asyncHandler } from '../utils';
import { TRole } from '../modules/Auth/auth.constant';
import { Auth } from '../modules/Auth/auth.model';
import { console } from 'inspector';
import { verifyToken } from '../lib';

const auth = (...requiredRoles: TRole[]) => {
  return asyncHandler(async (req, res, next) => {
    const token =
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies?.accessToken;

    // checking if the token is missing
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    // checking if the given token is valid
    const decoded = verifyToken(token) as JwtPayload;

    const { id } = decoded;

    // checking if the user is exist
    const user = await Auth.findById(id);

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not exists!');
    }

    if (user.isDeleted) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    if (user.isDeactivated) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You account is Deactive now!'
      );
    }

    if (!user.isActive) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    console.log('role', requiredRoles);

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You have no access to this route, Forbidden!'
      );
    }

    req.user = user;
    next();
  });
};

export default auth;

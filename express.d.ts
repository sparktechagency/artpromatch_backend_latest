import { IAuth } from './src/app/modules/auth/auth.interface';

declare global {
  namespace Express {
    interface Request {
      user: IAuth;
    }
  }
}

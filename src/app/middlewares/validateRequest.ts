import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import { asyncHandler } from '../utils';

export const validateRequest = (schema: AnyZodObject) => {
  return asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      const parsedData = await schema.parseAsync({
        body: req.body,
        cookies: req.cookies,
        query: req.query,
        params: req.params,
      });

      // overwrite validated values
      req.body = parsedData.body || req.body;
      req.query = parsedData.query || req.query;
      req.params = parsedData.params || req.params;
      req.cookies = parsedData.cookies || req.cookies;

      next();
    }
  );
};

export const validateRequestFromFormData = (schema: AnyZodObject) => {
  return asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      if (req?.body?.data) {
        const parsedData = await schema.parseAsync({
          body: JSON.parse(req.body.data),
          cookies: req.cookies,
        });

        req.body = parsedData.body;
        req.cookies = parsedData.cookies;

        next();
      }
    }
  );
};

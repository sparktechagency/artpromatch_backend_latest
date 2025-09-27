/*
 * Title: Steady Hands
 * Description: A tatto sales backend system using express
 * Author: Md Naim Uddin
 * Github: naimuddin94
 * Date: 25/03/2025
 *
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import cron from 'node-cron';
import httpStatus from 'http-status';
import express, { Application, NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import routes from './app/routes';
import { AppError, globalErrorHandler, notFound } from './app/utils';
import { stripeWebhookHandler } from './app/lib/stripe.webhookt';
import { expireBoosts } from './app/modules/Artist/artist.service';

const app: Application = express();

const httpServer = createServer(app);
app.set('httpServer', httpServer);

app.use(
  cors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://dlmiked-artpro-match-5500-client.vercel.app',
      'https://dlmiked-artpro-match-5500-artist.vercel.app',
    ],
  })
);
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);
app.use(cookieParser());
app.use(morgan('dev'));

// static files
app.use('/public', express.static('public'));

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

//Testing
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send({ message: 'Server is running like a Rabit!' });
});

cron.schedule('0 */2 * * *', async () => {
   try {
    await expireBoosts();
  } catch (error: unknown) {
    new AppError(
          httpStatus.BAD_REQUEST,
          error instanceof Error ? error.message : String(error)
        )
  }
});

//global error handler
app.use(globalErrorHandler as unknown as express.ErrorRequestHandler);

//handle not found
app.use(notFound);

export default app;

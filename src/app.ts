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
import morgan from 'morgan';
import express, { Application, NextFunction, Request, Response } from 'express';
import routes from './app/routes';
import { globalErrorHandler, notFound } from './app/utils';
import { createServer } from 'http';
import { Server } from 'socket.io';
import initSocketIo from './app/socket/chat.socket';
import { stripeWebhookHandler } from './app/lib/stripe.webhookt';


const app: Application = express();

// !socket
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    // credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  pingTimeout: 60000, // How long to wait for ping response
  pingInterval: 25000, // How often to ping
  transports: ['websocket', 'polling'], // Enable WebSocket first, fallback to polling
  allowUpgrades: true,
  maxHttpBufferSize: 2e6, // 1MB - Adjust based on your needs
  connectTimeout: 45000,
});

app.set('io', io);
app.set('httpServer', httpServer);
// console.log(config.allowed_origin)

initSocketIo(io);

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
    ],
  })
);
app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
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

//global error handler
app.use(globalErrorHandler as unknown as express.ErrorRequestHandler);

//handle not found
app.use(notFound);

export default app;

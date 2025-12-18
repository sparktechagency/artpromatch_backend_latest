/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import { Server } from 'http';
import { connect } from 'mongoose';
import app from './app';
import config from './app/config';
import { connectSocket } from './app/socket/connectSocket';
// import { Logger } from './app/utils';
import seedingAdmin from './app/utils/seeding';

let server: Server;

async function bootstrap() {
  try {
    await connect(config.db_url as string);
    console.log('🛢  Database connected successfully');

    await seedingAdmin();

    server = app.get('httpServer');
    server = server.listen(config.port, () => {
      console.log(`🚀  Application is running on port ${config.port}`);
    });

    connectSocket(server);
  } catch (err: any) {
    console.error('🔴 ❌  Failed to connect to database:', err);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', () => {
  console.log('🔴❌ SIGTERM received');
  if (server) {
    server.close((error) => {
      console.error('🔴❌ Server closed due to SIGTERM', error);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🔴❌ SIGINT received');
  if (server) {
    server.close((error) => {
      console.error('🔴❌ Server closed due to SIGINT', error);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🔴❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('🔴❌ Unhandled Rejection:', error);
  if (server) {
    server.close((error) => {
      console.error('🔴❌ Server closed due to unhandled rejection', error);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

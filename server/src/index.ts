import http from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './db/connection.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { setupScreencastServer } from './modules/automation/sessionStream/streamServer.js';

async function bootstrap() {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    // Setup screencast WebSocket streaming server
    setupScreencastServer(server);

    server.listen(env.PORT, () => {
      logger.info(`🚀 AutoSocial Server running on http://localhost:${env.PORT}`);
      logger.info(`🌐 Allowed Client Origin: ${env.CLIENT_URL}`);
      logger.info(`⚙️  Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        logger.info('Process terminated.');
        process.exit(0);
      });

      // Force exit after 10s if stuck
      setTimeout(() => {
        logger.error('Forcefully exiting after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();

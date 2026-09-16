import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/database';
import { Logger } from './utils/logger';

let server: http.Server | null = null;

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      Logger.info(`ReleaseHub API server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      Logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    Logger.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  Logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async (err) => {
      if (err) {
        Logger.error(`Error closing HTTP server: ${err.message}`);
      } else {
        Logger.info('HTTP server closed successfully');
      }

      try {
        await disconnectDB();
        Logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (dbErr) {
        const dbMessage = dbErr instanceof Error ? dbErr.message : 'Unknown error';
        Logger.error(`Error during database disconnect: ${dbMessage}`);
        process.exit(1);
      }
    });

    // Force close after 10s timeout
    setTimeout(() => {
      Logger.error('Shutdown timed out. Forcing process termination.');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

// Handle process termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  Logger.error('Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Launch server
startServer();

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler, apiLimiter } from './middleware';

export const createApp = (): Application => {
  const app: Application = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configuration
  // Strict origin check using CLIENT_URL with credentials support; never wildcard with credentials
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request body parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing middleware
  app.use(cookieParser());

  // Rate limiting on API routes
  app.use('/api', apiLimiter);

  // API v1 Routes
  app.use('/api/v1', apiRoutes);

  // 404 Not Found handler
  app.use(notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;

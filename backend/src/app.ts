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
  // Supports configurable origins via CLIENT_URL / ALLOWED_ORIGINS with credentials support; never wildcard
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, Postman, or server-to-server)
        if (!requestOrigin) {
          return callback(null, true);
        }

        // Check configured allowed origins
        if (env.ALLOWED_ORIGINS.includes(requestOrigin)) {
          return callback(null, true);
        }

        // In non-production environments, dynamically allow any localhost / 127.0.0.1 port (e.g., 5173, 5174, etc.)
        if (env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 200,
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

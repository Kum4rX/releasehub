import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Global API rate limiter middleware.
 * Standard limit: 100 requests per 15 minutes per IP (dynamically relaxed in test mode).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: () => (process.env.NODE_ENV === 'test' ? 5000 : 100),
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(
      res,
      'TOO_MANY_REQUESTS',
      'Too many requests from this IP, please try again after 15 minutes',
      429
    );
  },
});

/**
 * Stricter rate limiter for sensitive authentication endpoints.
 * 10 requests per 15 minutes in production/development, dynamically relaxed in test mode.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: () => (process.env.NODE_ENV === 'test' ? 1000 : 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(
      res,
      'TOO_MANY_REQUESTS',
      'Too many authentication attempts, please try again after 15 minutes',
      429
    );
  },
});

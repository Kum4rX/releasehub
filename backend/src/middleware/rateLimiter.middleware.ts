import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Global API rate limiter middleware.
 * Standard limit: 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
 * Stricter rate limiter foundation for sensitive auth endpoints (Milestone 2 ready).
 * 10 requests per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

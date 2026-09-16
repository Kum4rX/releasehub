import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Admin Authorization Middleware Foundation (Milestone 1 Placeholder)
 * Ensures authenticated user has admin role.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication is required', 401);
    return;
  }

  if (req.user.role !== 'admin') {
    ApiResponse.error(res, 'FORBIDDEN', 'Admin privileges required', 403);
    return;
  }

  next();
};

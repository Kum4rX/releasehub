import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { UserRole } from '../models/user.model';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Authentication Middleware Foundation (Milestone 1 Placeholder)
 * Full JWT verification will be implemented in Milestone 2.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
    return;
  }

  // Placeholder token extraction for foundation
  // Will be wired to JWT access token verification in Milestone 2
  next();
};

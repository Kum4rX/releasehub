import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { UserRole, User } from '../models/user.model';
import { AuthService, AuthError } from '../services/auth.service';
import { ACCESS_COOKIE_NAME } from '../utils/cookie.util';

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
 * Authentication Middleware
 * Reads access token from HTTP-only cookie (or Bearer Authorization header fallback).
 * Verifies JWT using JWT_ACCESS_SECRET, confirms user exists, and attaches safe user info to req.user.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : undefined;

    const token = cookieToken || headerToken;

    if (!token) {
      ApiResponse.error(
        res,
        'UNAUTHORIZED',
        'Authentication token is required',
        401
      );
      return;
    }

    const payload = AuthService.verifyAccessToken(token);

    const user = await User.findById(payload.userId);
    if (!user) {
      ApiResponse.error(res, 'UNAUTHORIZED', 'Authenticated user no longer exists', 401);
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      ApiResponse.error(res, error.code, error.message, error.statusCode);
      return;
    }
    ApiResponse.error(res, 'UNAUTHORIZED', 'Invalid or expired access token', 401);
  }
};

// Backwards compatibility alias
export const authenticate = requireAuth;

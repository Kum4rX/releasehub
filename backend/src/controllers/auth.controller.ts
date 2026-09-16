import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthError } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE_NAME,
} from '../utils/cookie.util';

export class AuthController {
  /**
   * POST /api/v1/auth/signup
   */
  static async signup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await AuthService.signup(name, email, password);

      ApiResponse.success(
        res,
        {
          user: result.user,
          verificationToken: result.verificationToken,
        },
        201
      );
    } catch (error) {
      if (error instanceof AuthError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   */
  static async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.body;
      const result = await AuthService.verifyEmail(token);
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof AuthError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Set access and refresh tokens as secure HTTP-only cookies
      setAuthCookies(res, result.accessToken, result.refreshToken);

      ApiResponse.success(res, {
        user: result.user,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  static async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        ApiResponse.error(
          res,
          'UNAUTHORIZED',
          'Refresh token is required in cookie',
          401
        );
        return;
      }

      const result = await AuthService.refresh(refreshToken);

      // Replace with rotated tokens
      setAuthCookies(res, result.accessToken, result.refreshToken);

      ApiResponse.success(res, {
        message: 'Tokens rotated and refreshed successfully',
      });
    } catch (error) {
      if (error instanceof AuthError) {
        // Clear invalid cookies on failed rotation
        clearAuthCookies(res);
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const userId = req.user?.id;

      await AuthService.logout(userId, refreshToken);
      clearAuthCookies(res);

      ApiResponse.success(res, {
        message: 'Logged out successfully',
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication is required', 401);
        return;
      }

      const user = await AuthService.getMe(req.user.id);
      ApiResponse.success(res, { user });
    } catch (error) {
      if (error instanceof AuthError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof AuthError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      ApiResponse.success(res, result);
    } catch (error) {
      if (error instanceof AuthError) {
        ApiResponse.error(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

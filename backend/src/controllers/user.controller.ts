import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { UserService } from '../services/user.service';

export class UserController {
  /**
   * GET /api/v1/users/me
   * Retrieve currently authenticated user's profile.
   */
  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication is required', 401);
        return;
      }

      const profile = await UserService.getProfile(req.user.id);
      ApiResponse.success(res, { profile });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/me
   * Update authenticated user's profile (name only).
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication is required', 401);
        return;
      }

      const profile = await UserService.updateProfile(req.user.id, req.body);
      ApiResponse.success(res, { profile });
    } catch (error) {
      next(error);
    }
  }
}

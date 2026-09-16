import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * Get What's New notification updates and unread count.
   */
  static async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication is required', 401);
        return;
      }

      const data = await NotificationService.getWhatsNew(req.user.id);
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications/read
   * Mark all notifications as read for current user.
   */
  static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'UNAUTHORIZED', 'Authentication is required', 401);
        return;
      }

      const data = await NotificationService.markAllAsRead(req.user.id);
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

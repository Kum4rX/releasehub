import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AdminService } from '../services/admin.service';

export class AdminController {
  /**
   * GET /api/v1/admin/insights
   * Retrieve aggregated system insights and metrics for administrators.
   */
  static async getInsights(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const insights = await AdminService.getInsights();
      ApiResponse.success(res, insights);
    } catch (error) {
      next(error);
    }
  }
}

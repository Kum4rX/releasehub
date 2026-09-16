import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Health check controller
 * GET /api/v1/health
 */
export const getHealth = (_req: Request, res: Response): void => {
  ApiResponse.success(res, {
    status: 'ok',
    service: 'releasehub-api',
  });
};

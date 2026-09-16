import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export type ValidatorFn = (data: unknown) => { valid: boolean; errors?: string[] };

/**
 * Validation Middleware Foundation (Milestone 1 Placeholder)
 * Higher-order middleware to validate request body, query, or params.
 */
export const validateRequest = (
  validator: ValidatorFn,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req[target]);

    if (!result.valid) {
      ApiResponse.error(
        res,
        'VALIDATION_ERROR',
        'Request data failed validation',
        400,
        result.errors
      );
      return;
    }

    next();
  };
};

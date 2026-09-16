import { ValidatorFn } from '../middleware/validation.middleware';

/**
 * Validates update user profile request body (PATCH /api/v1/users/me).
 */
export const validateUpdateProfileInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { name } = data as Record<string, unknown>;

  if (name === undefined || name === null) {
    errors.push('Name is required');
  } else if (typeof name !== 'string') {
    errors.push('Name must be a string');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

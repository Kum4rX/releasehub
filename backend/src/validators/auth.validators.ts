import { ValidatorFn } from '../middleware/validation.middleware';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpper && hasLower && hasNumber;
};

/**
 * Signup Input Validator
 */
export const validateSignupInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { name, email, password } = data as Record<string, unknown>;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (!isValidPassword(password)) {
    errors.push(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Login Input Validator
 */
export const validateLoginInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { email, password } = data as Record<string, unknown>;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Email Verification Input Validator
 */
export const validateVerifyEmailInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { token } = data as Record<string, unknown>;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('Verification token is required');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Forgot Password Input Validator
 */
export const validateForgotPasswordInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { email } = data as Record<string, unknown>;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Reset Password Input Validator
 */
export const validateResetPasswordInput: ValidatorFn = (data: unknown) => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const { token, password } = data as Record<string, unknown>;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('Reset token is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (!isValidPassword(password)) {
    errors.push(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { ApiResponse } from '../utils/apiResponse';
import { validateRequest } from '../middleware/validation.middleware';
import {
  validateSignupInput,
  validateLoginInput,
  validateVerifyEmailInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from '../validators/auth.validators';

const router = Router();

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  authLimiter,
  validateRequest(validateSignupInput),
  AuthController.signup
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address using verification token
 * @access  Public
 */
router.post(
  '/verify-email',
  authLimiter,
  validateRequest(validateVerifyEmailInput),
  AuthController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and set HTTP-only JWT cookies
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateRequest(validateLoginInput),
  AuthController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rotate and refresh JWT access and refresh tokens
 * @access  Public (Requires refresh_token cookie)
 */
router.post('/refresh', authLimiter, AuthController.refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out user and clear auth cookies
 * @access  Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Protected (Requires valid access_token)
 */
router.get('/me', requireAuth, AuthController.getMe);

/**
 * @route   GET /api/v1/auth/admin-only
 * @desc    Admin role verification route
 * @access  Admin only (Requires valid access_token and admin role)
 */
router.get('/admin-only', requireAuth, requireAdmin, (req, res) => {
  ApiResponse.success(res, {
    message: 'Welcome Admin',
    user: req.user,
  });
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Initiate password reset workflow
 * @access  Public
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateRequest(validateForgotPasswordInput),
  AuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Complete password reset with token and new password
 * @access  Public
 */
router.post(
  '/reset-password',
  authLimiter,
  validateRequest(validateResetPasswordInput),
  AuthController.resetPassword
);

export default router;

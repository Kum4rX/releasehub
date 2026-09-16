import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { validateUpdateProfileInput } from '../validators/user.validators';

const router = Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Retrieve profile of currently authenticated user
 * @access  Protected
 */
router.get('/me', requireAuth, UserController.getProfile);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update profile fields (name) for authenticated user
 * @access  Protected
 */
router.patch(
  '/me',
  requireAuth,
  validateRequest(validateUpdateProfileInput),
  UserController.updateProfile
);

export default router;

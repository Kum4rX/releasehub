import { Router } from 'express';
import { ChangelogController } from '../controllers/changelog.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  validateCreateChangelogInput,
  validateUpdateChangelogInput,
  validateReactionInput,
  validateObjectId,
  validateReactionTypeParam,
  validateChangelogQuery,
} from '../validators/changelog.validators';

const router = Router();

// ==========================================
// ADMIN ROUTES
// ==========================================

/**
 * @route   POST /api/v1/changelog
 * @desc    Create a new draft changelog
 * @access  Admin only
 */
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(validateCreateChangelogInput),
  ChangelogController.createChangelog
);

/**
 * @route   GET /api/v1/changelog/admin
 * @desc    List all changelogs (drafts & published) with filters
 * @access  Admin only
 */
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  validateChangelogQuery,
  ChangelogController.listAdminChangelogs
);

/**
 * @route   GET /api/v1/changelog/admin/:id
 * @desc    Get single changelog for admin review
 * @access  Admin only
 */
router.get(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  validateObjectId('id'),
  ChangelogController.getAdminChangelogById
);

/**
 * @route   POST /api/v1/changelog/:id/publish
 * @desc    Publish a changelog
 * @access  Admin only
 */
router.post(
  '/:id/publish',
  requireAuth,
  requireAdmin,
  validateObjectId('id'),
  ChangelogController.publishChangelog
);

/**
 * @route   POST /api/v1/changelog/:id/unpublish
 * @desc    Unpublish a changelog back to draft
 * @access  Admin only
 */
router.post(
  '/:id/unpublish',
  requireAuth,
  requireAdmin,
  validateObjectId('id'),
  ChangelogController.unpublishChangelog
);

/**
 * @route   PATCH /api/v1/changelog/:id
 * @desc    Update a changelog
 * @access  Admin only
 */
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validateObjectId('id'),
  validateRequest(validateUpdateChangelogInput),
  ChangelogController.updateChangelog
);

/**
 * @route   DELETE /api/v1/changelog/:id
 * @desc    Delete a changelog and its reactions
 * @access  Admin only
 */
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validateObjectId('id'),
  ChangelogController.deleteChangelog
);

// ==========================================
// REACTION ROUTES
// ==========================================

/**
 * @route   POST /api/v1/changelog/:id/reactions
 * @desc    Add a reaction to a published changelog
 * @access  Protected (Authenticated users)
 */
router.post(
  '/:id/reactions',
  requireAuth,
  validateObjectId('id'),
  validateRequest(validateReactionInput),
  ChangelogController.addReaction
);

/**
 * @route   DELETE /api/v1/changelog/:id/reactions/:type
 * @desc    Remove a reaction from a changelog
 * @access  Protected (Authenticated users)
 */
router.delete(
  '/:id/reactions/:type',
  requireAuth,
  validateObjectId('id'),
  validateReactionTypeParam('type'),
  ChangelogController.removeReaction
);

// ==========================================
// PUBLIC ROUTES
// (Static routes declared before dynamic :slug)
// ==========================================

/**
 * @route   GET /api/v1/changelog/feed
 * @desc    Public JSON feed of published updates
 * @access  Public
 */
router.get('/feed', ChangelogController.getPublicFeed);

/**
 * @route   GET /api/v1/changelog
 * @desc    Public changelog timeline with search, category filtering & pagination
 * @access  Public
 */
router.get('/', validateChangelogQuery, ChangelogController.listPublicChangelogs);

/**
 * @route   GET /api/v1/changelog/:slug/related
 * @desc    Get related published changelog updates
 * @access  Public
 */
router.get('/:slug/related', ChangelogController.getRelatedChangelogs);

/**
 * @route   GET /api/v1/changelog/:slug
 * @desc    Get public changelog detail by slug (with reaction state if authenticated)
 * @access  Public (Optional Auth)
 */
router.get('/:slug', optionalAuth, ChangelogController.getPublicChangelogBySlug);

export default router;

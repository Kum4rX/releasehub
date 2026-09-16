import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get What's New notification updates and unread count
 * @access  Protected
 */
router.get('/', requireAuth, NotificationController.getNotifications);

/**
 * @route   POST /api/v1/notifications/read
 * @desc    Mark all changelog updates as read for the authenticated user
 * @access  Protected
 */
router.post('/read', requireAuth, NotificationController.markAsRead);

export default router;

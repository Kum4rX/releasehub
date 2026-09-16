import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * @route   GET /api/v1/admin/insights
 * @desc    Retrieve aggregated system metrics and insights
 * @access  Protected (Admin only)
 */
router.get('/insights', requireAuth, requireAdmin, AdminController.getInsights);

export default router;

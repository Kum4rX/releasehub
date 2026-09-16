import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import changelogRoutes from './changelog.routes';
import notificationRoutes from './notification.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Mount v1 route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/changelog', changelogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;

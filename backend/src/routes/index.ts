import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import changelogRoutes from './changelog.routes';

const router = Router();

// Mount v1 route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/changelog', changelogRoutes);

export default router;

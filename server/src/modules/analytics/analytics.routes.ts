import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', authenticate, AnalyticsController.getDashboardData);
router.get('/detailed', authenticate, AnalyticsController.getDetailedAnalytics);

export const analyticsRoutes = router;

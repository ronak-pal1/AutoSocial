import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { Job } from '../../models/Job.js';
import { Post } from '../../models/Post.js';
import { ProviderSession } from '../../models/ProviderSession.js';

export class AnalyticsController {
  public static async getDashboardData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [kpis, recentJobs, recentPosts, sessions] = await Promise.all([
        AnalyticsService.getDashboardKPIs(),
        Job.find().sort({ createdAt: -1 }).limit(6).lean(),
        Post.find().sort({ createdAt: -1 }).limit(5).lean(),
        ProviderSession.find().lean()
      ]);

      res.status(200).json({
        success: true,
        data: {
          kpis,
          recentJobs,
          recentPosts,
          sessions
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getDetailedAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as '7d' | '30d' | '90d' | 'all') || '30d';
      const data = await AnalyticsService.getDetailedAnalytics(range);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

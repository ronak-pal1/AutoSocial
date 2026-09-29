import { Job } from '../../models/Job.js';
import { Post } from '../../models/Post.js';
import { ImageModel } from '../../models/Image.js';

export interface DashboardKPIs {
  totalGenerations: number;
  draftsCount: number;
  readyCount: number;
  postedCount: number;
  totalImages: number;
  successRate: number;
  avgDurationMs: number;
}

export interface DetailedAnalytics {
  timeRange: string;
  totalJobs: number;
  successRate: number;
  avgDurationSeconds: number;
  p95DurationSeconds: number;
  timeline: Array<{ date: string; total: number; succeeded: number; failed: number }>;
  providerStats: Array<{ provider: string; count: number }>;
  platformStats: Array<{ platform: string; count: number; draft: number; ready: number; posted: number }>;
  statusFunnel: Array<{ status: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export class AnalyticsService {
  public static async getDashboardKPIs(): Promise<DashboardKPIs> {
    const [totalJobs, succeededJobs, postStatuses, totalImages, avgDurationRes] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'succeeded' }),
      Post.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      ImageModel.countDocuments(),
      Job.aggregate<{ _id: null; avgMs: number }>([
        { $match: { durationMs: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, avgMs: { $avg: '$durationMs' } } }
      ])
    ]);

    let draftsCount = 0;
    let readyCount = 0;
    let postedCount = 0;

    postStatuses.forEach((ps) => {
      if (ps._id === 'draft') draftsCount = ps.count;
      if (ps._id === 'ready') readyCount = ps.count;
      if (ps._id === 'posted') postedCount = ps.count;
    });

    const successRate = totalJobs > 0 ? Math.round((succeededJobs / totalJobs) * 100) : 100;
    const avgDurationMs = avgDurationRes.length > 0 ? Math.round(avgDurationRes[0].avgMs) : 0;

    return {
      totalGenerations: totalJobs,
      draftsCount,
      readyCount,
      postedCount,
      totalImages,
      successRate,
      avgDurationMs
    };
  }

  public static async getDetailedAnalytics(range: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<DetailedAnalytics> {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const matchFilter: Record<string, unknown> = range !== 'all' ? { createdAt: { $gte: cutoffDate } } : {};

    const [
      totalJobs,
      succeededJobs,
      timelineRes,
      providerRes,
      platformRes,
      postStatusRes,
      topTagsRes,
      durationsRes
    ] = await Promise.all([
      Job.countDocuments(matchFilter),
      Job.countDocuments({ ...matchFilter, status: 'succeeded' }),

      // Timeline aggregation by date
      Job.aggregate<{ _id: string; total: number; succeeded: number; failed: number }>([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            succeeded: {
              $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Provider breakdown
      Job.aggregate<{ _id: string; count: number }>([
        { $match: matchFilter },
        { $group: { _id: '$provider', count: { $sum: 1 } } }
      ]),

      // Platform breakdown
      Post.aggregate<{
        _id: string;
        count: number;
        draft: number;
        ready: number;
        posted: number;
      }>([
        { $match: matchFilter },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            ready: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
            posted: { $sum: { $cond: [{ $eq: ['$status', 'posted'] }, 1, 0] } }
          }
        }
      ]),

      // Status funnel
      Post.aggregate<{ _id: string; count: number }>([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Top tags
      Post.aggregate<{ _id: string; count: number }>([
        { $match: matchFilter },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Durations array for percentile calculation
      Job.find({ ...matchFilter, durationMs: { $exists: true, $gt: 0 } }, { durationMs: 1 })
        .sort({ durationMs: 1 })
        .lean()
    ]);

    const successRate = totalJobs > 0 ? Math.round((succeededJobs / totalJobs) * 100) : 100;

    let avgDurationSeconds = 0;
    let p95DurationSeconds = 0;

    if (durationsRes.length > 0) {
      const sum = durationsRes.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
      avgDurationSeconds = Number((sum / durationsRes.length / 1000).toFixed(1));

      const p95Index = Math.floor(durationsRes.length * 0.95);
      const p95Ms = durationsRes[Math.min(p95Index, durationsRes.length - 1)].durationMs || 0;
      p95DurationSeconds = Number((p95Ms / 1000).toFixed(1));
    }

    return {
      timeRange: range,
      totalJobs,
      successRate,
      avgDurationSeconds,
      p95DurationSeconds,
      timeline: timelineRes.map((t) => ({
        date: t._id,
        total: t.total,
        succeeded: t.succeeded,
        failed: t.failed
      })),
      providerStats: providerRes.map((p) => ({ provider: p._id, count: p.count })),
      platformStats: platformRes.map((pl) => ({
        platform: pl._id,
        count: pl.count,
        draft: pl.draft,
        ready: pl.ready,
        posted: pl.posted
      })),
      statusFunnel: postStatusRes.map((s) => ({ status: s._id, count: s.count })),
      topTags: topTagsRes.map((t) => ({ tag: t._id, count: t.count }))
    };
  }
}

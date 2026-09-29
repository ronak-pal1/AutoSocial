import type { Request, Response, NextFunction } from 'express';
import { GenerationService } from './generation.service.js';
import { Job } from '../../models/Job.js';
import { jobQueue, type JobEventPayload } from '../automation/queue/JobQueue.js';

export class GenerationController {
  public static async generateText(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await GenerationService.generateText({
        ...req.body,
        userId: req.user?.userId,
        source: 'portal'
      });
      res.status(202).json({ success: true, data: { job } });
    } catch (error) {
      next(error);
    }
  }

  public static async generateImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await GenerationService.generateImage({
        ...req.body,
        userId: req.user?.userId,
        source: 'portal'
      });
      res.status(202).json({ success: true, data: { job } });
    } catch (error) {
      next(error);
    }
  }

  public static async generatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { job } = await GenerationService.generateSocialPost({
        ...req.body,
        userId: req.user?.userId,
        source: 'portal'
      });
      res.status(202).json({ success: true, data: { job } });
    } catch (error) {
      next(error);
    }
  }

  public static async getBrandVoice(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voice = await GenerationService.getBrandVoice();
      res.status(200).json({ success: true, data: voice });
    } catch (error) {
      next(error);
    }
  }

  public static async updateBrandVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voice = await GenerationService.updateBrandVoice(req.body);
      res.status(200).json({ success: true, data: voice });
    } catch (error) {
      next(error);
    }
  }

  public static async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const status = req.query.status as string | undefined;

      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;

      const jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }

  public static async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await Job.findById(req.params.id).lean();
      if (!job) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
        return;
      }
      res.status(200).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  // Server-Sent Events (SSE) streaming live job updates
  public static streamJobs(_req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    const listener = (payload: JobEventPayload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    jobQueue.on('job_update', listener);

    _req.on('close', () => {
      jobQueue.off('job_update', listener);
      res.end();
    });
  }
}

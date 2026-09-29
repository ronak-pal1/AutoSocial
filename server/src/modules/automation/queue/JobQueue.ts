import EventEmitter from 'events';
import { Job, type IJob, type JobType, type JobSource } from '../../../models/Job.js';
import { providerRegistry } from '../providers/index.js';
import { BrowserManager } from '../BrowserManager.js';
import { logger } from '../../../utils/logger.js';
import type { ProviderType } from '../types.js';

export interface EnqueueJobOptions {
  type: JobType;
  provider: ProviderType | 'mock';
  prompt: string;
  params?: Record<string, unknown>;
  createdBy?: string;
  source?: JobSource;
}

export interface JobEventPayload {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  provider: string;
  type: string;
  result?: Record<string, unknown>;
  error?: string;
}

class JobQueueService extends EventEmitter {
  private processing: Map<string, boolean> = new Map();
  private queues: Map<string, string[]> = new Map(); // provider -> array of job IDs

  constructor() {
    super();
    this.queues.set('gemini', []);
    this.queues.set('chatgpt', []);
    this.queues.set('mock', []);
  }

  public async enqueue(options: EnqueueJobOptions): Promise<IJob> {
    const job = await Job.create({
      type: options.type,
      provider: options.provider,
      prompt: options.prompt,
      params: options.params || {},
      status: 'queued',
      createdBy: options.createdBy,
      source: options.source || 'portal'
    });

    const providerKey = options.provider;
    if (!this.queues.has(providerKey)) {
      this.queues.set(providerKey, []);
    }
    this.queues.get(providerKey)!.push(job._id.toString());

    this.emitEvent({
      jobId: job._id.toString(),
      status: 'queued',
      provider: options.provider,
      type: options.type
    });

    // Trigger process loop for this provider
    this.processNext(providerKey).catch((err) => {
      logger.error({ err, provider: providerKey }, 'Error in queue processing cycle');
    });

    return job;
  }

  private emitEvent(payload: JobEventPayload) {
    this.emit('job_update', payload);
    this.emit(`job:${payload.jobId}`, payload);
  }

  private async processNext(provider: string): Promise<void> {
    if (this.processing.get(provider)) {
      return; // Already working on a job for this provider (concurrency 1)
    }

    const queue = this.queues.get(provider);
    if (!queue || queue.length === 0) {
      return;
    }

    const jobId = queue.shift();
    if (!jobId) return;

    this.processing.set(provider, true);
    const startTime = Date.now();

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        this.processing.set(provider, false);
        this.processNext(provider);
        return;
      }

      job.status = 'running';
      await job.save();

      this.emitEvent({
        jobId,
        status: 'running',
        provider: job.provider,
        type: job.type
      });

      const adapter = providerRegistry.getAdapter(job.provider as ProviderType | 'mock');
      const tab = await adapter.newChat();

      let resultData: Record<string, unknown> = {};

      try {
        if (job.type === 'text' || job.type === 'post') {
          const res = await adapter.sendPrompt(tab, job.prompt, {
            systemHint: (job.params?.systemHint as string) || undefined
          });
          resultData = { text: res.text };
        } else if (job.type === 'image') {
          const imgRes = await adapter.generateImage(tab, job.prompt, {
            aspectRatio: (job.params?.aspectRatio as '1:1' | '16:9') || '1:1'
          });
          resultData = {
            bufferBase64: imgRes.buffer.toString('base64'),
            mime: imgRes.mime
          };
        }

        job.status = 'succeeded';
        job.result = resultData;
        job.durationMs = Date.now() - startTime;
        await job.save();

        this.emitEvent({
          jobId,
          status: 'succeeded',
          provider: job.provider,
          type: job.type,
          result: resultData
        });
      } catch (execError: unknown) {
        // Attempt failure screenshot if tab has page
        let screenshotPath = '';
        if (tab.page && !tab.page.isClosed()) {
          screenshotPath = await BrowserManager.getInstance().takeFailureScreenshot(tab.page, jobId);
        }

        const errMsg = execError instanceof Error ? execError.message : String(execError);
        job.status = 'failed';
        job.error = errMsg;
        job.errorScreenshot = screenshotPath;
        job.durationMs = Date.now() - startTime;
        await job.save();

        this.emitEvent({
          jobId,
          status: 'failed',
          provider: job.provider,
          type: job.type,
          error: errMsg
        });
      } finally {
        await adapter.closeTab(tab);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await Job.findByIdAndUpdate(jobId, {
        status: 'failed',
        error: errMsg,
        durationMs: Date.now() - startTime
      });

      this.emitEvent({
        jobId,
        status: 'failed',
        provider,
        type: 'unknown',
        error: errMsg
      });
    } finally {
      this.processing.set(provider, false);
      // Process next item in queue for this provider
      this.processNext(provider);
    }
  }

  public getActiveJobsCount(): number {
    let count = 0;
    for (const isRunning of this.processing.values()) {
      if (isRunning) count++;
    }
    for (const q of this.queues.values()) {
      count += q.length;
    }
    return count;
  }
}

export const jobQueue = new JobQueueService();

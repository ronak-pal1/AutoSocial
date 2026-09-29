import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type JobType = 'text' | 'image' | 'post';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type JobSource = 'portal' | 'mcp';

export interface IJob extends Document {
  type: JobType;
  provider: 'gemini' | 'chatgpt' | 'mock';
  prompt: string;
  params: Record<string, unknown>;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  errorScreenshot?: string;
  durationMs?: number;
  createdBy?: Types.ObjectId;
  source: JobSource;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'post'],
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['gemini', 'chatgpt', 'mock'],
      required: true,
      index: true
    },
    prompt: {
      type: String,
      required: true
    },
    params: {
      type: Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'failed'],
      default: 'queued',
      index: true
    },
    result: {
      type: Schema.Types.Mixed
    },
    error: {
      type: String
    },
    errorScreenshot: {
      type: String
    },
    durationMs: {
      type: Number
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['portal', 'mcp'],
      default: 'portal',
      index: true
    }
  },
  {
    timestamps: true
  }
);

JobSchema.index({ createdAt: -1 });

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

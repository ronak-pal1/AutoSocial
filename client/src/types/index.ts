export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export type ProviderType = 'gemini' | 'chatgpt';
export type SessionStatus = 'connected' | 'login_required' | 'disconnected' | 'error';

export interface ProviderSession {
  _id: string;
  provider: ProviderType;
  status: SessionStatus;
  lastCheckedAt?: string;
  profilePath: string;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type JobType = 'text' | 'image' | 'post';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type JobSource = 'portal' | 'mcp';

export interface Job {
  _id: string;
  type: JobType;
  provider: 'gemini' | 'chatgpt' | 'mock';
  prompt: string;
  params: Record<string, unknown>;
  status: JobStatus;
  result?: {
    text?: string;
    imageUrl?: string;
    imageId?: string;
    postId?: string;
    data?: Record<string, unknown>;
  };
  error?: string;
  errorScreenshot?: string;
  durationMs?: number;
  source: JobSource;
  createdAt: string;
  updatedAt: string;
}

export interface ImageItem {
  _id: string;
  storage: 'local' | 'gridfs' | 's3';
  filePath: string;
  filename: string;
  mime: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  prompt: string;
  jobId?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwitterTweet {
  order: number;
  text: string;
  imageIds?: string[];
}

export interface TwitterPayload {
  thread: TwitterTweet[];
}

export interface LinkedInPayload {
  body: string;
  hashtags?: string[];
  imageIds?: string[];
  hook?: string;
}

export type PostPlatform = 'linkedin' | 'twitter';
export type PostStatus = 'draft' | 'ready' | 'posted' | 'archived';

export interface PostItem {
  _id: string;
  platform: PostPlatform;
  status: PostStatus;
  title: string;
  topic: string;
  tags: string[];
  campaignId?: string;
  images: Array<string | ImageItem>;
  source: 'portal' | 'mcp';
  postedAt?: string;
  externalUrl?: string;
  payload: TwitterPayload | LinkedInPayload;
  createdAt: string;
  updatedAt: string;
}

export interface BrandVoice {
  _id?: string;
  tone: string;
  niche: string;
  audience: string;
  dos: string[];
  donts: string[];
  samplePosts: string[];
}

export interface ResearchNote {
  _id: string;
  title: string;
  content: string;
  sources: string[];
  tags: string[];
  source: 'portal' | 'mcp';
  createdAt: string;
  updatedAt: string;
}

export interface McpApiKeyItem {
  _id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  revoked: boolean;
  createdAt: string;
  plainKey?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

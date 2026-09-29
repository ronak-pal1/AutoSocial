import type { Page } from 'puppeteer-core';
import type { ProviderType, SessionStatus } from '../../models/ProviderSession.js';

export type { ProviderType, SessionStatus };

export interface TabHandle {
  id: string;
  provider: ProviderType | 'mock';
  page?: Page;
  createdAt: Date;
}

export interface PromptOptions {
  systemHint?: string;
  timeoutMs?: number;
  temperature?: number;
}

export interface ImageOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  timeoutMs?: number;
}

export interface ProviderHealth {
  provider: ProviderType | 'mock';
  status: SessionStatus;
  lastCheckedAt: Date;
  details?: string;
}

export interface ProviderAdapter {
  readonly provider: ProviderType | 'mock';
  ensureSession(): Promise<SessionStatus>;
  newChat(): Promise<TabHandle>;
  sendPrompt(tab: TabHandle, prompt: string, opts?: PromptOptions): Promise<{ text: string }>;
  generateImage(tab: TabHandle, prompt: string, opts?: ImageOptions): Promise<{ buffer: Buffer; mime: string }>;
  healthCheck(): Promise<ProviderHealth>;
  closeTab(tab: TabHandle): Promise<void>;
}

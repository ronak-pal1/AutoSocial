import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdapter } from '../MockAdapter.js';
import type { ProviderAdapter } from '../../types.js';

describe('ProviderAdapter Contract Tests', () => {
  let adapter: ProviderAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it('implements ensureSession returning valid SessionStatus', async () => {
    const status = await adapter.ensureSession();
    expect(['connected', 'login_required', 'disconnected', 'error']).toContain(status);
  });

  it('implements newChat returning TabHandle with valid ID and createdAt', async () => {
    const tab = await adapter.newChat();
    expect(tab.id).toBeDefined();
    expect(tab.createdAt).toBeInstanceOf(Date);
    expect(tab.provider).toBe('mock');
  });

  it('implements sendPrompt returning text response', async () => {
    const tab = await adapter.newChat();
    const res = await adapter.sendPrompt(tab, 'Explain software architecture');
    expect(res.text).toBeDefined();
    expect(typeof res.text).toBe('string');
    expect(res.text.length).toBeGreaterThan(0);
  });

  it('implements sendPrompt generating valid JSON Twitter thread when requested', async () => {
    const tab = await adapter.newChat();
    const res = await adapter.sendPrompt(tab, 'Generate a Twitter thread about AI');
    const parsed = JSON.parse(res.text);
    expect(parsed.thread).toBeInstanceOf(Array);
    expect(parsed.thread.length).toBeGreaterThan(0);
    expect(parsed.thread[0].order).toBe(1);
    expect(parsed.thread[0].text).toBeDefined();
  });

  it('implements generateImage returning buffer and mime type', async () => {
    const tab = await adapter.newChat();
    const imgRes = await adapter.generateImage(tab, 'Futuristic city in neon purple and cyan');
    expect(Buffer.isBuffer(imgRes.buffer)).toBe(true);
    expect(imgRes.buffer.length).toBeGreaterThan(0);
    expect(imgRes.mime).toBe('image/svg+xml');
  });

  it('implements healthCheck returning ProviderHealth', async () => {
    const health = await adapter.healthCheck();
    expect(health.provider).toBe('mock');
    expect(health.status).toBe('connected');
    expect(health.lastCheckedAt).toBeInstanceOf(Date);
  });
});

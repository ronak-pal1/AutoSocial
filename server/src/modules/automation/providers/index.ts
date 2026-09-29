import type { ProviderAdapter, ProviderType } from '../types.js';
import { GeminiAdapter } from './GeminiAdapter.js';
import { ChatGPTAdapter } from './ChatGPTAdapter.js';
import { MockAdapter } from './MockAdapter.js';

export * from './GeminiAdapter.js';
export * from './ChatGPTAdapter.js';
export * from './MockAdapter.js';

class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    this.adapters.set('gemini', new GeminiAdapter());
    this.adapters.set('chatgpt', new ChatGPTAdapter());
    this.adapters.set('mock', new MockAdapter());
  }

  public getAdapter(provider: ProviderType | 'mock'): ProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unsupported provider: "${provider}"`);
    }
    return adapter;
  }

  public registerAdapter(name: string, adapter: ProviderAdapter): void {
    this.adapters.set(name, adapter);
  }
}

export const providerRegistry = new ProviderRegistry();

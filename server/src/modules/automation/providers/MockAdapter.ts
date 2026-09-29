import type {
  ProviderAdapter,
  TabHandle,
  PromptOptions,
  ImageOptions,
  ProviderHealth,
  SessionStatus
} from '../types.js';

export class MockAdapter implements ProviderAdapter {
  public readonly provider = 'mock' as const;
  private sessionStatus: SessionStatus = 'connected';

  public setMockStatus(status: SessionStatus) {
    this.sessionStatus = status;
  }

  public async ensureSession(): Promise<SessionStatus> {
    return this.sessionStatus;
  }

  public async newChat(): Promise<TabHandle> {
    return {
      id: `mock_tab_${Date.now()}`,
      provider: 'mock',
      createdAt: new Date()
    };
  }

  public async sendPrompt(_tab: TabHandle, prompt: string, _opts?: PromptOptions): Promise<{ text: string }> {
    // If prompt is expecting a Twitter thread JSON
    if (prompt.includes('"thread"') || prompt.includes('Twitter thread')) {
      return {
        text: JSON.stringify({
          topic: 'Engineering AI Pipelines',
          thread: [
            {
              order: 1,
              text: '90% of engineers build AI workflows backwards.\n\nThey write backend glue code before testing real chat model behaviors.\n\nHere is how to design rock-solid content pipelines in 2026 🧵👇'
            },
            {
              order: 2,
              text: '1. Model First, Code Second.\n\nBefore writing a single API route, benchmark prompt variations directly in production-grade LLM interfaces. Measure token stability and edge-case drift.'
            },
            {
              order: 3,
              text: '2. Persistent Profile Architecture.\n\nRather than paying exorbitant per-token API costs for daily content drafts, leverage persistent browser profiles with CDP screencast sessions.'
            },
            {
              order: 4,
              text: '3. Enforce Strict Schemas.\n\nAlways validate outputs against Zod schemas. If the model returns markdown wrapped in code blocks, strip backticks and auto-heal the JSON.'
            },
            {
              order: 5,
              text: 'What is your current stack for automated social distribution? Drop your thoughts below or bookmark this thread for later!'
            }
          ]
        })
      };
    }

    // If prompt is expecting a LinkedIn post JSON
    if (prompt.includes('"body"') || prompt.includes('LinkedIn')) {
      return {
        text: JSON.stringify({
          title: 'The Blueprint for Autonomous Content Automation',
          hook: 'Most engineering teams are wasting thousands of dollars on generic LLM API calls.',
          body: 'Most engineering teams are wasting thousands of dollars on generic LLM API calls.\n\nHere is what changed in our architecture:\n\n• Session-based browser pooling with CDP streaming\n• Strict Zod validation on all generated threads\n• Direct MCP tool integration allowing external research bots to push daily insights directly into draft queues\n\nThe result? 100% human-verified quality, zero API bills, and 5x faster publishing cycles.\n\nWhat does your content automation pipeline look like?',
          hashtags: ['#SoftwareEngineering', '#ArtificialIntelligence', '#Automation', '#TechLeadership']
        })
      };
    }

    return {
      text: `Generated response for: "${prompt.substring(0, 100)}..."\n\nAI automation enables consistent brand presence across LinkedIn and Twitter without compromising human editorial control.`
    };
  }

  public async generateImage(_tab: TabHandle, prompt: string, _opts?: ImageOptions): Promise<{ buffer: Buffer; mime: string }> {
    // Generate a high-contrast modern SVG image converted into Buffer
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#31104b" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" />
        <circle cx="200" cy="150" r="100" fill="#6366f1" opacity="0.3" filter="blur(40px)" />
        <circle cx="1000" cy="450" r="140" fill="#a855f7" opacity="0.25" filter="blur(50px)" />
        <text x="80" y="240" fill="#ffffff" font-family="system-ui, sans-serif" font-size="44" font-weight="bold">AutoSocial Production Visual</text>
        <text x="80" y="320" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="24">${prompt.replace(/<[^>]*>/g, '').substring(0, 80)}</text>
        <rect x="80" y="480" width="180" height="40" rx="10" fill="#6366f1" />
        <text x="110" y="506" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="600">AutoSocial AI</text>
      </svg>
    `.trim();

    const buffer = Buffer.from(svg, 'utf-8');
    return { buffer, mime: 'image/svg+xml' };
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: 'mock',
      status: this.sessionStatus,
      lastCheckedAt: new Date(),
      details: 'Mock adapter operating nominally'
    };
  }

  public async closeTab(_tab: TabHandle): Promise<void> {
    // No-op for mock
  }
}

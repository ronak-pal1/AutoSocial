import { describe, it, expect } from 'vitest';
import {
  PromptBuilder,
  twitterThreadOutputSchema,
  linkedInOutputSchema
} from '../promptBuilder.js';

describe('PromptBuilder Service', () => {
  it('builds Twitter prompt injecting topic, rules, and brand voice', () => {
    const prompt = PromptBuilder.buildTwitterPrompt({
      topic: 'How to Build an Agentic IDE',
      tweetCount: 4,
      brandVoice: {
        tone: 'Insightful and fast-paced',
        dos: ['Use code examples']
      }
    });

    expect(prompt).toContain('How to Build an Agentic IDE');
    expect(prompt).toContain('Insightful and fast-paced');
    expect(prompt).toContain('280 characters');
    expect(prompt).toContain('"thread"');
  });

  it('builds LinkedIn prompt with magnetic hook and hashtag guidelines', () => {
    const prompt = PromptBuilder.buildLinkedInPrompt({
      topic: 'Why We Stopped Paying for LLM APIs',
      tone: 'Contrarian'
    });

    expect(prompt).toContain('Why We Stopped Paying for LLM APIs');
    expect(prompt).toContain('Contrarian');
    expect(prompt).toContain('...see more');
  });

  it('correctly parses raw clean JSON matching twitterThreadOutputSchema', () => {
    const validJson = JSON.stringify({
      topic: 'Automation',
      thread: [
        { order: 1, text: 'This is the hook tweet of the thread.' },
        { order: 2, text: 'This is tweet number two with actionable insight.' }
      ]
    });

    const parsed = PromptBuilder.cleanAndParseJson(validJson, twitterThreadOutputSchema);
    expect(parsed.thread).toHaveLength(2);
    expect(parsed.thread[0].order).toBe(1);
    expect(parsed.thread[0].text).toBe('This is the hook tweet of the thread.');
  });

  it('strips markdown code fences before validating JSON', () => {
    const wrappedJson = '```json\n{"title": "My Post", "hook": "Awesome hook", "body": "Full body text that is long enough to pass validation.", "hashtags": ["#AI"]}\n```';

    const parsed = PromptBuilder.cleanAndParseJson(wrappedJson, linkedInOutputSchema);
    expect(parsed.title).toBe('My Post');
    expect(parsed.hashtags).toContain('#AI');
  });

  it('throws BadRequestError when tweet text exceeds 280 characters', () => {
    const tooLongTweet = 'a'.repeat(285);
    const invalidJson = JSON.stringify({
      topic: 'Overflow',
      thread: [{ order: 1, text: tooLongTweet }]
    });

    expect(() => {
      PromptBuilder.cleanAndParseJson(invalidJson, twitterThreadOutputSchema);
    }).toThrow(/AI output did not match expected schema/);
  });
});

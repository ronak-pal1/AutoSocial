import { z } from 'zod';
import type { IBrandVoice } from '../../models/BrandVoice.js';
import { BadRequestError } from '../../errors/AppError.js';

export const twitterThreadOutputSchema = z.object({
  topic: z.string().default(''),
  thread: z.array(
    z.object({
      order: z.number(),
      text: z.string().max(280, 'Each tweet in the thread must be 280 characters or fewer')
    })
  ).min(1, 'Thread must contain at least 1 tweet')
});

export type TwitterThreadOutput = z.infer<typeof twitterThreadOutputSchema>;

export const linkedInOutputSchema = z.object({
  title: z.string().default(''),
  hook: z.string().default(''),
  body: z.string().min(20, 'LinkedIn post body must be substantive'),
  hashtags: z.array(z.string()).default([])
});

export type LinkedInOutput = z.infer<typeof linkedInOutputSchema>;

export class PromptBuilder {
  public static formatBrandVoice(brandVoice?: Partial<IBrandVoice>): string {
    if (!brandVoice) return '';

    const lines: string[] = ['BRAND VOICE & EDITORIAL GUIDELINES:'];
    if (brandVoice.tone) lines.push(`- Tone: ${brandVoice.tone}`);
    if (brandVoice.niche) lines.push(`- Industry/Niche: ${brandVoice.niche}`);
    if (brandVoice.audience) lines.push(`- Target Audience: ${brandVoice.audience}`);

    if (brandVoice.dos && brandVoice.dos.length > 0) {
      lines.push('- Rules to FOLLOW:');
      brandVoice.dos.forEach((d) => lines.push(`  * ${d}`));
    }

    if (brandVoice.donts && brandVoice.donts.length > 0) {
      lines.push('- Rules to AVOID:');
      brandVoice.donts.forEach((d) => lines.push(`  * ${d}`));
    }

    return lines.join('\n');
  }

  public static buildTwitterPrompt(params: {
    topic: string;
    context?: string;
    tone?: string;
    tweetCount?: number;
    brandVoice?: Partial<IBrandVoice>;
  }): string {
    const brand = this.formatBrandVoice(params.brandVoice);
    const count = params.tweetCount || 5;

    return `You are a world-class Twitter/X content creator and ghostwriter.
${brand}

TASK:
Write an engaging, high-retention Twitter thread (${count} tweets) about: "${params.topic}".
${params.context ? `Additional Context/Sources:\n${params.context}\n` : ''}
${params.tone ? `Tone Override: ${params.tone}\n` : ''}

STRICT TWITTER RULES:
1. Tweet 1 (Hook): Must stop the scroll immediately. Bold promise, counter-intuitive insight, or compelling statistic.
2. Body Tweets: Exactly one concrete idea per tweet. Use punchy sentences and line breaks. Maximum 280 characters per tweet (STRICT!).
3. Final Tweet: Clear CTA (e.g. follow, retweet, share thoughts).
4. No hashtags in the body tweets.
5. You MUST return ONLY a valid, parseable JSON object without markdown code blocks, following this exact schema:
{
  "topic": "${params.topic}",
  "thread": [
    { "order": 1, "text": "Hook tweet text..." },
    { "order": 2, "text": "Second tweet text..." }
  ]
}`;
  }

  public static buildLinkedInPrompt(params: {
    topic: string;
    context?: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    brandVoice?: Partial<IBrandVoice>;
  }): string {
    const brand = this.formatBrandVoice(params.brandVoice);

    return `You are a premier executive copywriter and LinkedIn thought leader.
${brand}

TASK:
Write an authoritative LinkedIn post on: "${params.topic}".
${params.context ? `Additional Context/Sources:\n${params.context}\n` : ''}
${params.tone ? `Tone Override: ${params.tone}\n` : ''}

STRICT LINKEDIN RULES:
1. Hook: The first 2-3 lines before the "...see more" cutoff must be magnetic and curiosity-provoking.
2. Structure: Short 1-2 sentence paragraphs with clear line breaks. High scannability with bullet points or dashes.
3. Substance: Focus on actionable lessons, architectural decisions, metrics, or personal experiences.
4. CTA & Hashtags: End with an engaging question for comments and 3-5 relevant industry hashtags (e.g. #SoftwareEngineering).
5. Output format: You MUST return ONLY a valid, parseable JSON object without surrounding markdown code blocks:
{
  "title": "Short descriptive internal title",
  "hook": "Magnetic first sentence",
  "body": "Full formatted post with clean line breaks and bullets",
  "hashtags": ["#Tech", "#Engineering"]
}`;
  }

  public static buildImagePrompt(params: {
    topic: string;
    postText?: string;
    style?: string;
    brandVoice?: Partial<IBrandVoice>;
  }): string {
    const style = params.style || 'modern sleek 3D render, dark background, cinematic volumetric lighting, vibrant purple and cyan accent neon, clean geometric composition';

    return `High resolution visual concept for social media post about "${params.topic}".
Visual Style: ${style}.
Mood: Professional, innovative, cutting-edge, tech-forward.
Constraints: No text overlays, no misspelled typography, high contrast, clean focal point, 8k resolution aesthetics.`;
  }

  public static cleanAndParseJson<T>(rawText: string, schema: z.ZodSchema<T>): T {
    let cleaned = rawText.trim();

    // Strip markdown code fences (```json ... ``` or ``` ...)
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    // Try finding JSON bounds if surrounding chatter exists
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);
      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        throw new BadRequestError('AI output did not match expected schema', validated.error.format());
      }
      return validated.data;
    } catch (parseErr: unknown) {
      if (parseErr instanceof BadRequestError) {
        throw parseErr;
      }
      throw new BadRequestError(`Failed to parse AI output into JSON: ${(parseErr as Error).message}`);
    }
  }
}

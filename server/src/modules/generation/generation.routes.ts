import { Router } from 'express';
import { z } from 'zod';
import { GenerationController } from './generation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { generationLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

const textSchema = {
  body: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    provider: z.enum(['gemini', 'chatgpt', 'mock']).optional(),
    systemHint: z.string().optional()
  })
};

const imageSchema = {
  body: z.object({
    prompt: z.string().min(1, 'Image prompt is required'),
    provider: z.enum(['gemini', 'chatgpt', 'mock']).optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).optional()
  })
};

const postSchema = {
  body: z.object({
    platform: z.enum(['twitter', 'linkedin']),
    topic: z.string().min(2, 'Topic is required'),
    context: z.string().optional(),
    tone: z.string().optional(),
    tweetCount: z.number().min(2).max(15).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    withImage: z.boolean().optional(),
    provider: z.enum(['gemini', 'chatgpt', 'mock']).optional(),
    campaignId: z.string().optional()
  })
};

// Generation endpoints (rate-limited and authenticated)
router.post('/text', authenticate, generationLimiter, validate(textSchema), GenerationController.generateText);
router.post('/image', authenticate, generationLimiter, validate(imageSchema), GenerationController.generateImage);
router.post('/post', authenticate, generationLimiter, validate(postSchema), GenerationController.generatePost);

// Brand voice management
router.get('/brand-voice', authenticate, GenerationController.getBrandVoice);
router.put('/brand-voice', authenticate, GenerationController.updateBrandVoice);

// Jobs management
router.get('/jobs', authenticate, GenerationController.getJobs);
router.get('/jobs/stream', GenerationController.streamJobs);
router.get('/jobs/:id', authenticate, GenerationController.getJobById);

export const generationRoutes = router;

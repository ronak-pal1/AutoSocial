import { Router } from 'express';
import { z } from 'zod';
import { PostsController } from './posts.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const createPostSchema = {
  body: z.object({
    platform: z.enum(['twitter', 'linkedin']),
    status: z.enum(['draft', 'ready', 'posted', 'archived']).optional(),
    title: z.string().min(1, 'Title is required'),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    campaignId: z.string().optional(),
    images: z.array(z.string()).optional(),
    payload: z.record(z.unknown())
  })
};

const updateStatusSchema = {
  body: z.object({
    status: z.enum(['draft', 'ready', 'posted', 'archived']),
    externalUrl: z.string().url().optional()
  })
};

const regenTweetSchema = {
  body: z.object({
    tweetOrder: z.number().min(1),
    prompt: z.string().optional()
  })
};

router.get('/', authenticate, PostsController.listPosts);
router.get('/:id', authenticate, PostsController.getPostById);
router.post('/', authenticate, validate(createPostSchema), PostsController.createPost);
router.put('/:id', authenticate, PostsController.updatePost);
router.patch('/:id/status', authenticate, validate(updateStatusSchema), PostsController.updateStatus);
router.post('/:id/regenerate-tweet', authenticate, validate(regenTweetSchema), PostsController.regenerateTweet);
router.delete('/:id', authenticate, PostsController.deletePost);

export const postRoutes = router;

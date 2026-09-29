import type { Request, Response, NextFunction } from 'express';
import { PostsService } from './posts.service.js';
import type { PostPlatform, PostStatus } from '../../models/Post.js';

export class PostsController {
  public static async listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { posts, total } = await PostsService.listPosts({
        platform: req.query.platform as PostPlatform | undefined,
        status: req.query.status as PostStatus | undefined,
        campaignId: req.query.campaignId as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        page: req.query.page ? Number(req.query.page) : undefined
      });
      res.status(200).json({ success: true, data: { posts, total } });
    } catch (error) {
      next(error);
    }
  }

  public static async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await PostsService.getPostById(id);
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  public static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await PostsService.createPost({
        ...req.body,
        userId: req.user?.userId
      });
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await PostsService.updatePost(id, req.body);
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, externalUrl } = req.body;
      const post = await PostsService.updatePostStatus(id, status, externalUrl);
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  public static async regenerateTweet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { tweetOrder, prompt } = req.body;
      const post = await PostsService.regenerateTweet({
        postId: id,
        tweetOrder: Number(tweetOrder),
        prompt
      });
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  public static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await PostsService.deletePost(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
        return;
      }
      res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

import { Post, type IPost, type PostPlatform, type PostStatus, type ITwitterPayload } from '../../models/Post.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';
import { GenerationService } from '../generation/generation.service.js';

export interface ListPostsFilter {
  platform?: PostPlatform;
  status?: PostStatus;
  campaignId?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export class PostsService {
  public static async listPosts(filter: ListPostsFilter): Promise<{ posts: IPost[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.platform) query.platform = filter.platform;
    if (filter.status) query.status = filter.status;
    if (filter.campaignId) query.campaignId = filter.campaignId;
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { topic: { $regex: filter.search, $options: 'i' } }
      ];
    }

    const limit = Math.min(filter.limit || 50, 100);
    const page = Math.max(filter.page || 1, 1);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query)
    ]);

    return { posts: posts as unknown as IPost[], total };
  }

  public static async getPostById(id: string): Promise<IPost> {
    const post = await Post.findById(id).populate('images').lean();
    if (!post) {
      throw new NotFoundError('Social post not found');
    }
    return post as unknown as IPost;
  }

  public static async createPost(data: Partial<IPost> & { userId?: string }): Promise<IPost> {
    if (!data.platform || !data.title || !data.payload) {
      throw new BadRequestError('Platform, title, and payload are required');
    }

    const post = await Post.create({
      ...data,
      status: data.status || 'draft',
      createdBy: data.userId
    });

    return post;
  }

  public static async updatePost(id: string, data: Partial<IPost>): Promise<IPost> {
    const post = await Post.findByIdAndUpdate(id, data, { new: true }).populate('images');
    if (!post) {
      throw new NotFoundError('Social post not found');
    }
    return post;
  }

  public static async updatePostStatus(id: string, status: PostStatus, externalUrl?: string): Promise<IPost> {
    const updateData: Partial<IPost> = { status };
    if (status === 'posted') {
      updateData.postedAt = new Date();
      if (externalUrl) updateData.externalUrl = externalUrl;
    }

    const post = await Post.findByIdAndUpdate(id, updateData, { new: true }).populate('images');
    if (!post) {
      throw new NotFoundError('Social post not found');
    }
    return post;
  }

  public static async deletePost(id: string): Promise<boolean> {
    const res = await Post.findByIdAndDelete(id);
    return !!res;
  }

  public static async regenerateTweet(params: {
    postId: string;
    tweetOrder: number;
    prompt?: string;
  }): Promise<IPost> {
    const post = await Post.findById(params.postId);
    if (!post) {
      throw new NotFoundError('Social post not found');
    }
    if (post.platform !== 'twitter') {
      throw new BadRequestError('Tweet regeneration only applies to Twitter threads');
    }

    const payload = post.payload as ITwitterPayload;
    const tweetIndex = payload.thread.findIndex((t) => t.order === params.tweetOrder);
    if (tweetIndex === -1) {
      throw new NotFoundError(`Tweet with order ${params.tweetOrder} not found in thread`);
    }

    const currentTweet = payload.thread[tweetIndex];
    const instruction = `Rewrite this single tweet in a Twitter thread.
Topic: "${post.topic || post.title}"
Current Tweet: "${currentTweet.text}"
Additional feedback: "${params.prompt || 'Make it punchier and highly engaging under 280 characters'}"
STRICT RULE: Output ONLY the revised tweet text under 280 characters. No quotes, no markdown, no explanations.`;

    const job = await GenerationService.generateText({
      prompt: instruction,
      provider: 'chatgpt'
    });

    // Wait briefly for job result (or poll)
    let newText = currentTweet.text;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 30000);
      import('../automation/queue/JobQueue.js').then(({ jobQueue }) => {
        jobQueue.once(`job:${job._id.toString()}`, (pl) => {
          clearTimeout(timer);
          if (pl.status === 'succeeded' && pl.result?.text) {
            newText = (pl.result.text as string).trim().replace(/^["']|["']$/g, '');
          }
          resolve();
        });
      });
    });

    payload.thread[tweetIndex].text = newText.substring(0, 280);
    post.markModified('payload');
    await post.save();

    return post;
  }
}

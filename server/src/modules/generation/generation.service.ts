import { jobQueue } from '../automation/queue/JobQueue.js';
import { PromptBuilder, twitterThreadOutputSchema, linkedInOutputSchema } from './promptBuilder.js';
import { storageService } from '../../services/StorageService.js';
import { Post, type IPost, type PostPlatform } from '../../models/Post.js';
import { BrandVoice, type IBrandVoice } from '../../models/BrandVoice.js';
import { Job, type IJob } from '../../models/Job.js';
import { BadRequestError } from '../../errors/AppError.js';
import type { ProviderType } from '../automation/types.js';

export interface GeneratePostParams {
  platform: PostPlatform;
  topic: string;
  context?: string;
  tone?: string;
  tweetCount?: number;
  length?: 'short' | 'medium' | 'long';
  withImage?: boolean;
  provider?: ProviderType | 'mock';
  campaignId?: string;
  userId?: string;
  source?: 'portal' | 'mcp';
}

export class GenerationService {
  public static async getBrandVoice(): Promise<IBrandVoice> {
    let voice = await BrandVoice.findOne();
    if (!voice) {
      voice = await BrandVoice.create({});
    }
    return voice;
  }

  public static async updateBrandVoice(data: Partial<IBrandVoice>): Promise<IBrandVoice> {
    let voice = await BrandVoice.findOne();
    if (!voice) {
      voice = await BrandVoice.create(data);
    } else {
      Object.assign(voice, data);
      await voice.save();
    }
    return voice;
  }

  public static async generateText(params: {
    prompt: string;
    provider?: ProviderType | 'mock';
    systemHint?: string;
    userId?: string;
    source?: 'portal' | 'mcp';
  }): Promise<IJob> {
    const provider = params.provider || 'gemini';
    return jobQueue.enqueue({
      type: 'text',
      provider,
      prompt: params.prompt,
      params: { systemHint: params.systemHint },
      createdBy: params.userId,
      source: params.source || 'portal'
    });
  }

  public static async generateImage(params: {
    prompt: string;
    provider?: ProviderType | 'mock';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
    userId?: string;
    source?: 'portal' | 'mcp';
  }): Promise<IJob> {
    const provider = params.provider || 'gemini';
    const job = await jobQueue.enqueue({
      type: 'image',
      provider,
      prompt: params.prompt,
      params: { aspectRatio: params.aspectRatio || '1:1' },
      createdBy: params.userId,
      source: params.source || 'portal'
    });

    // Listen for completion to save image to disk/storage
    const handleJobFinish = async (resultJob: IJob) => {
      if (resultJob.status === 'succeeded' && resultJob.result?.bufferBase64) {
        try {
          const buffer = Buffer.from(resultJob.result.bufferBase64 as string, 'base64');
          const mime = (resultJob.result.mime as string) || 'image/jpeg';
          const savedImage = await storageService.saveImage({
            buffer,
            mime,
            prompt: resultJob.prompt,
            jobId: resultJob._id.toString(),
            userId: params.userId
          });

          resultJob.result = {
            imageUrl: savedImage.url,
            imageId: savedImage._id.toString()
          };
          await resultJob.save();
        } catch (err) {
          console.error('Error saving generated image:', err);
        }
      }
    };

    jobQueue.once(`job:${job._id.toString()}`, async (payload) => {
      if (payload.status === 'succeeded' || payload.status === 'failed') {
        const fresh = await Job.findById(job._id);
        if (fresh) await handleJobFinish(fresh);
      }
    });

    return job;
  }

  public static async generateSocialPost(params: GeneratePostParams): Promise<{ job: IJob; postPromise?: Promise<IPost> }> {
    const brandVoice = await this.getBrandVoice();
    const provider = params.provider || (params.platform === 'twitter' ? 'chatgpt' : 'gemini');

    let prompt = '';
    if (params.platform === 'twitter') {
      prompt = PromptBuilder.buildTwitterPrompt({
        topic: params.topic,
        context: params.context,
        tone: params.tone,
        tweetCount: params.tweetCount || 5,
        brandVoice
      });
    } else {
      prompt = PromptBuilder.buildLinkedInPrompt({
        topic: params.topic,
        context: params.context,
        tone: params.tone,
        length: params.length || 'medium',
        brandVoice
      });
    }

    const job = await jobQueue.enqueue({
      type: 'post',
      provider,
      prompt,
      params: {
        platform: params.platform,
        topic: params.topic,
        withImage: params.withImage,
        campaignId: params.campaignId
      },
      createdBy: params.userId,
      source: params.source || 'portal'
    });

    // When post job finishes, parse output, optionally generate image, and create Post in DB
    const postPromise = new Promise<IPost>((resolve, reject) => {
      jobQueue.once(`job:${job._id.toString()}`, async (payload) => {
        if (payload.status === 'failed') {
          reject(new BadRequestError(payload.error || 'Generation failed'));
          return;
        }

        try {
          const rawText = payload.result?.text as string;
          let imageIds: string[] = [];

          let title = params.topic;
          let payloadData: unknown;

          if (params.platform === 'twitter') {
            const threadData = PromptBuilder.cleanAndParseJson(rawText, twitterThreadOutputSchema);
            title = threadData.topic || params.topic;
            payloadData = { thread: threadData.thread };
          } else {
            const linkedInData = PromptBuilder.cleanAndParseJson(rawText, linkedInOutputSchema);
            title = linkedInData.title || params.topic;
            payloadData = {
              body: linkedInData.body,
              hook: linkedInData.hook,
              hashtags: linkedInData.hashtags
            };
          }

          // If withImage requested, trigger image generation
          if (params.withImage) {
            const imagePrompt = PromptBuilder.buildImagePrompt({
              topic: params.topic,
              postText: rawText,
              brandVoice
            });

            try {
              const imageJob = await this.generateImage({
                prompt: imagePrompt,
                provider: 'gemini',
                userId: params.userId,
                source: params.source
              });

              // Wait for image job to complete
              await new Promise<void>((imgResolve) => {
                jobQueue.once(`job:${imageJob._id.toString()}`, (imgPayload) => {
                  if (imgPayload.status === 'succeeded' && imgPayload.result?.imageId) {
                    imageIds.push(imgPayload.result.imageId as string);
                  }
                  imgResolve();
                });
                // Max timeout for image wait
                setTimeout(imgResolve, 60000);
              });
            } catch (imgErr) {
              console.warn('Image generation failed for post:', imgErr);
            }
          }

          const post = await Post.create({
            platform: params.platform,
            status: 'draft',
            title,
            topic: params.topic,
            tags: params.platform === 'twitter' ? ['#TwitterThread'] : ['#LinkedInArticle'],
            campaignId: params.campaignId,
            images: imageIds,
            createdBy: params.userId,
            source: params.source || 'portal',
            payload: payloadData
          });

          // Link post to job
          await Job.findByIdAndUpdate(job._id, {
            'result.postId': post._id.toString()
          });

          resolve(post);
        } catch (err) {
          reject(err);
        }
      });
    });

    return { job, postPromise };
  }
}

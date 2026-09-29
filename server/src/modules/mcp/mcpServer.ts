import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool
} from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response, NextFunction } from 'express';
import { GenerationService } from '../generation/generation.service.js';
import { PostsService } from '../posts/posts.service.js';
import { ResearchNote } from '../../models/ResearchNote.js';
import { Job } from '../../models/Job.js';
import { logger } from '../../utils/logger.js';
import { authenticateMcp } from './mcpAuth.js';

// Define tools exposed by AutoSocial MCP Server
const TOOLS: Tool[] = [
  {
    name: 'gemini_generate_text',
    description:
      'Generate text, code, or ideas via your active personal Google Gemini browser session with zero token costs.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to execute' },
        provider: { type: 'string', enum: ['gemini', 'chatgpt'], description: 'Browser provider to drive' },
        systemHint: { type: 'string', description: 'Optional system instruction or role framing' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'generate_image',
    description:
      'Generate a high-resolution visual using browser session (Imagen 3 / DALL-E) and permanently store in AutoSocial.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed visual prompt' },
        aspectRatio: { type: 'string', enum: ['1:1', '16:9', '9:16', '4:3'], description: 'Aspect ratio' },
        provider: { type: 'string', enum: ['gemini', 'chatgpt'], description: 'Provider engine' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'create_twitter_thread',
    description:
      'Craft a viral Twitter/X thread strictly enforced at <= 280 chars per tweet, save as a draft Post in AutoSocial, and optionally generate an accompanying visual.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The core topic or premise' },
        context: { type: 'string', description: 'Supporting research or context' },
        tone: { type: 'string', description: 'Tone style override' },
        tweetCount: { type: 'number', description: 'Number of tweets (default 5)' },
        withImage: { type: 'boolean', description: 'Whether to generate an accompanying image' }
      },
      required: ['topic']
    }
  },
  {
    name: 'create_linkedin_post',
    description:
      'Generate an authoritative LinkedIn post with magnetic hook, readable line breaks, hashtags, and optional visual, saved directly into AutoSocial drafts.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Core topic of the article' },
        context: { type: 'string', description: 'Context or source findings' },
        tone: { type: 'string', description: 'Tone override' },
        length: { type: 'string', enum: ['short', 'medium', 'long'], description: 'Desired length' },
        withImage: { type: 'boolean', description: 'Whether to generate an accompanying visual' }
      },
      required: ['topic']
    }
  },
  {
    name: 'list_posts',
    description: 'List existing social post drafts, ready items, or published content in AutoSocial.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['twitter', 'linkedin'] },
        status: { type: 'string', enum: ['draft', 'ready', 'posted', 'archived'] },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'get_post',
    description: 'Retrieve full details, payload, and attached images of a social post by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The Post ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'update_post_status',
    description: 'Update the publication state of a post (e.g. mark as ready or posted with external URL).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Post ID' },
        status: { type: 'string', enum: ['draft', 'ready', 'posted', 'archived'] },
        externalUrl: { type: 'string', description: 'Optional URL where post was published' }
      },
      required: ['id', 'status']
    }
  },
  {
    name: 'save_research_note',
    description:
      'Push daily intelligence, trends, or research notes into AutoSocial database (ideal for research bots like Grok).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of research note' },
        content: { type: 'string', description: 'Markdown body of findings' },
        sources: { type: 'array', items: { type: 'string' }, description: 'URLs or citations' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Classification tags' }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'get_job',
    description: 'Check status, result, or error of a background automation job.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The Job ID' }
      },
      required: ['id']
    }
  }
];

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'autosocial-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // 1. List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // 2. Call tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info({ tool: name, args }, '⚙️ MCP Tool Called by external agent');

    try {
      switch (name) {
        case 'gemini_generate_text': {
          const { prompt, provider, systemHint } = args as {
            prompt: string;
            provider?: 'gemini' | 'chatgpt';
            systemHint?: string;
          };
          const job = await GenerationService.generateText({
            prompt,
            provider,
            systemHint,
            source: 'mcp'
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'Text generation job enqueued to browser automation',
                  jobId: job._id.toString(),
                  status: job.status,
                  pollTool: `Call get_job({ id: "${job._id}" }) to retrieve final result.`
                }, null, 2)
              }
            ]
          };
        }

        case 'generate_image': {
          const { prompt, aspectRatio, provider } = args as {
            prompt: string;
            aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
            provider?: 'gemini' | 'chatgpt';
          };
          const job = await GenerationService.generateImage({
            prompt,
            aspectRatio,
            provider,
            source: 'mcp'
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'Image render job queued to browser session',
                  jobId: job._id.toString(),
                  status: job.status,
                  pollTool: `Call get_job({ id: "${job._id}" }) to receive stored image URL once complete.`
                }, null, 2)
              }
            ]
          };
        }

        case 'create_twitter_thread': {
          const { topic, context, tone, tweetCount, withImage } = args as {
            topic: string;
            context?: string;
            tone?: string;
            tweetCount?: number;
            withImage?: boolean;
          };
          const { job, postPromise } = await GenerationService.generateSocialPost({
            platform: 'twitter',
            topic,
            context,
            tone,
            tweetCount,
            withImage,
            source: 'mcp'
          });

          // Wait up to 25s for completion or return job id for polling
          let resultSummary: Record<string, unknown> = {
            jobId: job._id.toString(),
            status: 'running',
            message: 'Generating Twitter thread via browser...'
          };

          if (postPromise) {
            try {
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT_ASYNC')), 24000)
              );
              const post = (await Promise.race([postPromise, timeoutPromise])) as unknown as { _id: string; title: string; payload: unknown };
              resultSummary = {
                postId: post._id.toString(),
                status: 'succeeded',
                title: post.title,
                payload: post.payload
              };
            } catch {
              // Return polling pointer
              resultSummary = {
                jobId: job._id.toString(),
                status: 'processing',
                message: 'Thread generation is processing in the browser. Poll get_job for results.'
              };
            }
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(resultSummary, null, 2) }]
          };
        }

        case 'create_linkedin_post': {
          const { topic, context, tone, length, withImage } = args as {
            topic: string;
            context?: string;
            tone?: string;
            length?: 'short' | 'medium' | 'long';
            withImage?: boolean;
          };
          const { job, postPromise } = await GenerationService.generateSocialPost({
            platform: 'linkedin',
            topic,
            context,
            tone,
            length,
            withImage,
            source: 'mcp'
          });

          let resultSummary: Record<string, unknown> = {
            jobId: job._id.toString(),
            status: 'running'
          };

          if (postPromise) {
            try {
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT_ASYNC')), 24000)
              );
              const post = (await Promise.race([postPromise, timeoutPromise])) as unknown as { _id: string; title: string; payload: unknown };
              resultSummary = {
                postId: post._id.toString(),
                status: 'succeeded',
                title: post.title,
                payload: post.payload
              };
            } catch {
              resultSummary = {
                jobId: job._id.toString(),
                status: 'processing',
                message: 'LinkedIn post generation processing in browser tab. Poll get_job for results.'
              };
            }
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(resultSummary, null, 2) }]
          };
        }

        case 'list_posts': {
          const { platform, status, limit } = (args || {}) as {
            platform?: 'twitter' | 'linkedin';
            status?: 'draft' | 'ready' | 'posted';
            limit?: number;
          };
          const { posts, total } = await PostsService.listPosts({ platform, status, limit });
          return {
            content: [{ type: 'text', text: JSON.stringify({ total, posts }, null, 2) }]
          };
        }

        case 'get_post': {
          const { id } = args as { id: string };
          const post = await PostsService.getPostById(id);
          return {
            content: [{ type: 'text', text: JSON.stringify(post, null, 2) }]
          };
        }

        case 'update_post_status': {
          const { id, status, externalUrl } = args as {
            id: string;
            status: 'draft' | 'ready' | 'posted' | 'archived';
            externalUrl?: string;
          };
          const post = await PostsService.updatePostStatus(id, status, externalUrl);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ message: `Post status updated to ${status}`, post }, null, 2)
              }
            ]
          };
        }

        case 'save_research_note': {
          const { title, content, sources, tags } = args as {
            title: string;
            content: string;
            sources?: string[];
            tags?: string[];
          };
          const note = await ResearchNote.create({
            title,
            content,
            sources: sources || [],
            tags: tags || ['#Research'],
            source: 'mcp'
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'Research note saved successfully',
                  noteId: note._id.toString(),
                  title: note.title
                }, null, 2)
              }
            ]
          };
        }

        case 'get_job': {
          const { id } = args as { id: string };
          const job = await Job.findById(id).lean();
          if (!job) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Job not found with ID: ${id}` }]
            };
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(job, null, 2) }]
          };
        }

        default:
          return {
            isError: true,
            content: [{ type: 'text', text: `Unknown MCP tool: ${name}` }]
          };
      }
    } catch (toolError: unknown) {
      const errMsg = toolError instanceof Error ? toolError.message : String(toolError);
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing tool ${name}: ${errMsg}` }]
      };
    }
  });

  return server;
}

// Active SSE transport sessions
const activeTransports = new Map<string, SSEServerTransport>();

export function mountMcpEndpoints(app: import('express').Express): void {
  const mcpServer = createMcpServer();

  // SSE Transport connection endpoint (authenticated via Bearer key)
  app.get('/mcp', authenticateMcp, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const transport = new SSEServerTransport('/mcp/messages', res);
      const sessionId = transport.sessionId;
      activeTransports.set(sessionId, transport);

      transport.onclose = () => {
        activeTransports.delete(sessionId);
      };

      await mcpServer.connect(transport);
      logger.info({ sessionId }, 'MCP Client connected over SSE');
    } catch (error) {
      next(error);
    }
  });

  // Client messages postback
  app.post('/mcp/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.query.sessionId as string;
      const transport = activeTransports.get(sessionId);

      if (!transport) {
        res.status(404).json({ error: 'MCP session not found or expired' });
        return;
      }

      await transport.handlePostMessage(req, res);
    } catch (error) {
      next(error);
    }
  });
}

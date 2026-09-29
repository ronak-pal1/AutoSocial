import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isDbConnected } from './db/connection.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { connectionRoutes } from './modules/automation/connections.routes.js';
import { generationRoutes } from './modules/generation/generation.routes.js';
import { imageRoutes } from './modules/images/images.routes.js';
import { postRoutes } from './modules/posts/posts.routes.js';
import { apiKeyRoutes } from './modules/mcp/apiKey.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { researchRoutes } from './modules/research/research.routes.js';
import { mountMcpEndpoints } from './modules/mcp/mcpServer.js';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Ensure storage directories exist
  const storagePath = path.resolve(env.STORAGE_DIR);
  const imagesPath = path.join(storagePath, 'images');
  const screenshotsPath = path.join(storagePath, 'screenshots');
  const profilesPath = path.join(storagePath, 'profiles');

  for (const dir of [storagePath, imagesPath, screenshotsPath, profilesPath]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Serve static files for uploaded / generated media
  app.use('/storage', express.static(storagePath));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    const dbStatus = isDbConnected();
    res.status(dbStatus ? 200 : 503).json({
      status: dbStatus ? 'healthy' : 'degraded',
      dbConnected: dbStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Apply general rate limiter to API routes
  app.use('/api', standardLimiter);

  // Auth routes
  app.use('/api/auth', authRoutes);

  // Automation Connection routes
  app.use('/api/connections', connectionRoutes);

  // Generation and Jobs routes
  app.use('/api/generation', generationRoutes);
  app.use('/api', generationRoutes);

  // Images routes
  app.use('/api/images', imageRoutes);

  // Social Posts routes
  app.use('/api/posts', postRoutes);

  // Analytics routes
  app.use('/api/analytics', analyticsRoutes);

  // Research Notes routes
  app.use('/api/research', researchRoutes);

  // MCP API Keys routes
  app.use('/api/mcp-keys', apiKeyRoutes);

  // Mount Streamable MCP Server at /mcp
  mountMcpEndpoints(app);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

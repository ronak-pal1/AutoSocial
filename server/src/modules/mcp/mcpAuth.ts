import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { McpApiKey, type IMcpApiKey } from '../../models/McpApiKey.js';
import { UnauthorizedError, ForbiddenError } from '../../errors/AppError.js';

export function hashMcpKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function generateMcpRawKey(): { rawKey: string; keyPrefix: string; hashedKey: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `as_live_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 14); // "as_live_123456"
  const hashedKey = hashMcpKey(rawKey);

  return { rawKey, keyPrefix, hashedKey };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      mcpApiKey?: IMcpApiKey;
    }
  }
}

export async function authenticateMcp(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let rawKey: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.split(' ')[1].trim();
    } else if (req.query && typeof req.query.key === 'string') {
      rawKey = req.query.key.trim();
    }

    if (!rawKey) {
      throw new UnauthorizedError('MCP Bearer authentication key required in Authorization header or ?key= param');
    }

    const hashedKey = hashMcpKey(rawKey);
    const keyDoc = await McpApiKey.findOne({ hashedKey });

    if (!keyDoc) {
      throw new UnauthorizedError('Invalid MCP API key');
    }

    if (keyDoc.revoked) {
      throw new ForbiddenError('This MCP API key has been revoked');
    }

    // Update lastUsedAt asynchronously
    McpApiKey.findByIdAndUpdate(keyDoc._id, { lastUsedAt: new Date() }).exec();

    req.mcpApiKey = keyDoc;
    next();
  } catch (error) {
    next(error);
  }
}

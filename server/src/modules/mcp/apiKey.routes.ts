import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { McpApiKey } from '../../models/McpApiKey.js';
import { generateMcpRawKey } from './mcpAuth.js';
import { NotFoundError } from '../../errors/AppError.js';

const router = Router();

const createKeySchema = {
  body: z.object({
    name: z.string().min(1, 'Key name is required').max(50)
  })
};

// 1. List user API keys
router.get('/', authenticate, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const keys = await McpApiKey.find()
      .select('-hashedKey')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
});

// 2. Create new API key (returns plain secret rawKey ONCE)
router.post('/', authenticate, validate(createKeySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    const { rawKey, keyPrefix, hashedKey } = generateMcpRawKey();

    const keyDoc = await McpApiKey.create({
      name,
      hashedKey,
      keyPrefix,
      revoked: false,
      createdBy: req.user?.userId
    });

    res.status(201).json({
      success: true,
      data: {
        _id: keyDoc._id,
        name: keyDoc.name,
        keyPrefix: keyDoc.keyPrefix,
        plainKey: rawKey, // Shown only once upon creation
        createdAt: keyDoc.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Revoke key
router.patch('/:id/revoke', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const keyDoc = await McpApiKey.findByIdAndUpdate(id, { revoked: true }, { new: true });
    if (!keyDoc) {
      throw new NotFoundError('API key not found');
    }
    res.status(200).json({ success: true, data: keyDoc });
  } catch (error) {
    next(error);
  }
});

// 4. Delete key
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await McpApiKey.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError('API key not found');
    }
    res.status(200).json({ success: true, message: 'API key deleted' });
  } catch (error) {
    next(error);
  }
});

export const apiKeyRoutes = router;

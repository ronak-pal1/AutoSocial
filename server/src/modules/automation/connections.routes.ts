import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { ticketService } from './sessionStream/ticketService.js';
import { ProviderSession } from '../../models/ProviderSession.js';
import { providerRegistry } from './providers/index.js';
import { BrowserManager } from './BrowserManager.js';
import type { ProviderType } from './types.js';

const router = Router();

const providerSchema = {
  body: z.object({
    provider: z.enum(['gemini', 'chatgpt'])
  })
};

// 1. Get status of all provider sessions
router.get('/status', authenticate, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await ProviderSession.find().lean();
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

// 2. Generate short-lived ticket for screencast WebSocket authentication
router.post('/ticket', authenticate, validate(providerSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider } = req.body as { provider: ProviderType };
    const userId = req.user!.userId;

    const ticket = ticketService.createTicket(userId, provider);
    res.status(200).json({ success: true, data: { ticket } });
  } catch (error) {
    next(error);
  }
});

// 3. Trigger manual health check for provider
router.post('/check', authenticate, validate(providerSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider } = req.body as { provider: ProviderType };
    const adapter = providerRegistry.getAdapter(provider);
    const health = await adapter.healthCheck();

    await ProviderSession.findOneAndUpdate(
      { provider },
      { status: health.status, lastCheckedAt: health.lastCheckedAt },
      { upsert: true }
    );

    res.status(200).json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
});

// 4. Disconnect session and close browser
router.post('/disconnect', authenticate, validate(providerSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider } = req.body as { provider: ProviderType };
    await BrowserManager.getInstance().closeBrowser(provider);

    const session = await ProviderSession.findOneAndUpdate(
      { provider },
      { status: 'disconnected', lastCheckedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

export const connectionRoutes = router;

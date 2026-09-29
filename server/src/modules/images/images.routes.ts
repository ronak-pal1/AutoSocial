import { Router, type Request, type Response, type NextFunction } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import { authenticate } from '../../middleware/auth.middleware.js';
import { ImageModel } from '../../models/Image.js';
import { storageService } from '../../services/StorageService.js';

const router = Router();

// 1. List all images
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.prompt = { $regex: search, $options: 'i' };
    }

    const images = await ImageModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
});

// 2. Download images as ZIP archive
router.get('/zip', authenticate, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const images = await ImageModel.find().lean();
    if (images.length === 0) {
      res.status(400).json({ success: false, message: 'No images available to download' });
      return;
    }

    res.attachment(`autosocial-images-${Date.now()}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const img of images) {
      if (fs.existsSync(img.filePath)) {
        archive.file(img.filePath, { name: img.filename });
      }
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
});

// 3. Delete single image
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await storageService.deleteImage(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Image not found' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
});

export const imageRoutes = router;

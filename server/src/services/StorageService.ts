import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { ImageModel, type IImage } from '../models/Image.js';
import { logger } from '../utils/logger.js';

export interface IStorageService {
  saveImage(params: {
    buffer: Buffer;
    mime: string;
    prompt: string;
    jobId?: string;
    userId?: string;
    width?: number;
    height?: number;
  }): Promise<IImage>;
  deleteImage(id: string): Promise<boolean>;
  getImage(id: string): Promise<IImage | null>;
}

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.STORAGE_DIR, 'images');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public async saveImage(params: {
    buffer: Buffer;
    mime: string;
    prompt: string;
    jobId?: string;
    userId?: string;
    width?: number;
    height?: number;
  }): Promise<IImage> {
    const ext = params.mime.includes('svg')
      ? 'svg'
      : params.mime.includes('png')
      ? 'png'
      : params.mime.includes('webp')
      ? 'webp'
      : 'jpg';

    const hash = crypto.randomBytes(12).toString('hex');
    const filename = `gen_${Date.now()}_${hash}.${ext}`;
    const filePath = path.join(this.baseDir, filename);

    await fs.promises.writeFile(filePath, params.buffer);
    const sizeBytes = params.buffer.length;
    const url = `/storage/images/${filename}`;

    const imageDoc = await ImageModel.create({
      storage: 'local',
      filePath,
      filename,
      mime: params.mime,
      width: params.width || 1200,
      height: params.height || 630,
      sizeBytes,
      prompt: params.prompt,
      jobId: params.jobId,
      createdBy: params.userId,
      url
    });

    logger.info({ imageId: imageDoc._id, url, sizeBytes }, '🖼️ Image saved to local storage');
    return imageDoc;
  }

  public async deleteImage(id: string): Promise<boolean> {
    const image = await ImageModel.findById(id);
    if (!image) return false;

    if (fs.existsSync(image.filePath)) {
      try {
        await fs.promises.unlink(image.filePath);
      } catch (err) {
        logger.warn({ err, filePath: image.filePath }, 'Failed to unlink image file');
      }
    }

    await ImageModel.findByIdAndDelete(id);
    return true;
  }

  public async getImage(id: string): Promise<IImage | null> {
    return ImageModel.findById(id);
  }
}

export const storageService = new LocalStorageService();

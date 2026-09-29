import type { Request, Response, NextFunction } from 'express';
import { ResearchNote } from '../../models/ResearchNote.js';
import { NotFoundError } from '../../errors/AppError.js';
import { logger } from '../../utils/logger.js';

export class ResearchController {
  static async listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, tag, page = '1', limit = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const query: Record<string, unknown> = {};

      if (tag && typeof tag === 'string') {
        query.tags = tag;
      }

      if (search && typeof search === 'string' && search.trim().length > 0) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { content: { $regex: search.trim(), $options: 'i' } },
          { tags: { $in: [new RegExp(search.trim(), 'i')] } }
        ];
      }

      const [notes, total] = await Promise.all([
        ResearchNote.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        ResearchNote.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: notes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNoteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const note = await ResearchNote.findById(id).lean();

      if (!note) {
        throw new NotFoundError('Research note not found');
      }

      res.status(200).json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  static async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, content, sources = [], tags = [] } = req.body;
      const userId = req.user?.userId;

      const note = await ResearchNote.create({
        title,
        content,
        sources,
        tags,
        createdBy: userId,
        source: 'portal'
      });

      logger.info({ noteId: note._id, title: note.title }, 'Research note created');

      res.status(201).json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, sources, tags } = req.body;

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (sources !== undefined) updateData.sources = sources;
      if (tags !== undefined) updateData.tags = tags;

      const note = await ResearchNote.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (!note) {
        throw new NotFoundError('Research note not found');
      }

      res.status(200).json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ResearchNote.findByIdAndDelete(id);

      if (!result) {
        throw new NotFoundError('Research note not found');
      }

      res.status(200).json({
        success: true,
        message: 'Research note deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

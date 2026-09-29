import { Router } from 'express';
import { z } from 'zod';
import { ResearchController } from './research.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const noteIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note ID format')
});

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  sources: z.array(z.string().url('Invalid URL in sources')).optional().default([]),
  tags: z.array(z.string().min(1)).optional().default([])
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  sources: z.array(z.string().url('Invalid URL in sources')).optional(),
  tags: z.array(z.string().min(1)).optional()
});

router.use(authenticate);

router.get('/', ResearchController.listNotes);
router.post('/', validate({ body: createNoteSchema }), ResearchController.createNote);
router.get('/:id', validate({ params: noteIdParamSchema }), ResearchController.getNoteById);
router.patch(
  '/:id',
  validate({ params: noteIdParamSchema, body: updateNoteSchema }),
  ResearchController.updateNote
);
router.delete('/:id', validate({ params: noteIdParamSchema }), ResearchController.deleteNote);

export const researchRoutes = router;

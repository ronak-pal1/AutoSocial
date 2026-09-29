import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

const registerSchema = {
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required')
  })
};

router.get('/setup-status', AuthController.getSetupStatus);
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export const authRoutes = router;

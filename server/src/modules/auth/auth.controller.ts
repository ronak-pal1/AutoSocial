import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

export class AuthController {
  public static async getSetupStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await AuthService.getSetupStatus();
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await AuthService.registerFirstUser(req.body);

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await AuthService.login(req.body);

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const tokens = await AuthService.refresh(token);

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      res.status(200).json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }
      const user = await AuthService.getMe(userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
}

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. Handled AppError
  if (err instanceof AppError) {
    logger.warn({
      code: err.code,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      details: err.details
    }, `AppError handled [${err.code}]`);

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // 2. Zod validation error
  if (err instanceof ZodError) {
    logger.warn({
      path: req.originalUrl,
      issues: err.issues
    }, 'Validation error (Zod)');

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details: err.format()
      }
    });
    return;
  }

  // 3. Mongoose CastError or ValidationError
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'DB_VALIDATION_ERROR',
        message: err.message
      }
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource identifier format'
      }
    });
    return;
  }

  // 4. JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid'
      }
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
    return;
  }

  // 5. Unhandled unexpected errors
  logger.error({
    err,
    path: req.originalUrl,
    method: req.method
  }, 'Unhandled internal server error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message
    }
  });
}

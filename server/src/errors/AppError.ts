export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export type ProviderErrorCode =
  | 'LOGIN_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED'
  | 'CAPTCHA_TRIGGERED'
  | 'SELECTOR_MISMATCH'
  | 'BROWSER_CRASH'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE';

export class ProviderError extends AppError {
  public readonly provider: string;
  public readonly providerCode: ProviderErrorCode;

  constructor(provider: string, providerCode: ProviderErrorCode, message: string, details?: unknown) {
    const statusCode = providerCode === 'LOGIN_REQUIRED' || providerCode === 'SESSION_EXPIRED' ? 401 : 502;
    super(message, statusCode, `PROVIDER_${providerCode}`, details);
    this.provider = provider;
    this.providerCode = providerCode;
  }
}

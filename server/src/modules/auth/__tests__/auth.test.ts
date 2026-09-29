import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service.js';
import { User } from '../../../models/User.js';
import { env } from '../../../config/env.js';

vi.mock('../../../models/User.js', () => ({
  User: {
    countDocuments: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetupStatus', () => {
    it('returns hasAdmin: false when no user exists', async () => {
      vi.mocked(User.countDocuments).mockResolvedValueOnce(0);
      const res = await AuthService.getSetupStatus();
      expect(res.hasAdmin).toBe(false);
    });

    it('returns hasAdmin: true when at least one user exists', async () => {
      vi.mocked(User.countDocuments).mockResolvedValueOnce(1);
      const res = await AuthService.getSetupStatus();
      expect(res.hasAdmin).toBe(true);
    });
  });

  describe('registerFirstUser', () => {
    it('allows registration when no user exists', async () => {
      vi.mocked(User.countDocuments).mockResolvedValueOnce(0);
      const mockCreatedUser = {
        _id: { toString: () => 'mock-user-id-123' },
        email: 'test@admin.io',
        role: 'admin' as const,
        createdAt: new Date()
      };
      // @ts-expect-error Mocking mongoose model response
      vi.mocked(User.create).mockResolvedValueOnce(mockCreatedUser);

      const result = await AuthService.registerFirstUser({
        email: 'test@admin.io',
        password: 'Password123!'
      });

      expect(result.user.email).toBe('test@admin.io');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      const decoded = jwt.verify(result.tokens.accessToken, env.JWT_ACCESS_SECRET) as { userId: string };
      expect(decoded.userId).toBe('mock-user-id-123');
    });

    it('rejects registration when admin already exists', async () => {
      vi.mocked(User.countDocuments).mockResolvedValueOnce(1);

      await expect(
        AuthService.registerFirstUser({
          email: 'another@admin.io',
          password: 'Password123!'
        })
      ).rejects.toThrow(/Registration is disabled/);
    });
  });

  describe('login', () => {
    it('authenticates valid credentials', async () => {
      const password = 'SecretPassword123!';
      const hash = await bcrypt.hash(password, 10);
      const mockUser = {
        _id: { toString: () => 'user-456' },
        email: 'founder@ai.io',
        passwordHash: hash,
        role: 'admin' as const,
        createdAt: new Date()
      };

      // @ts-expect-error Mocking mongoose findOne
      vi.mocked(User.findOne).mockResolvedValueOnce(mockUser);

      const result = await AuthService.login({
        email: 'founder@ai.io',
        password
      });

      expect(result.user.email).toBe('founder@ai.io');
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 10);
      const mockUser = {
        _id: { toString: () => 'user-456' },
        email: 'founder@ai.io',
        passwordHash: hash,
        role: 'admin' as const,
        createdAt: new Date()
      };

      // @ts-expect-error Mocking mongoose findOne
      vi.mocked(User.findOne).mockResolvedValueOnce(mockUser);

      await expect(
        AuthService.login({
          email: 'founder@ai.io',
          password: 'WrongPassword'
        })
      ).rejects.toThrow(/Invalid email or password/);
    });
  });
});

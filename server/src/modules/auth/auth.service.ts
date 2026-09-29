import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../../errors/AppError.js';
import { User, type IUser } from '../../models/User.js';
import type { AuthUserPayload } from '../../middleware/auth.middleware.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export class AuthService {
  public static generateTokens(user: IUser): TokenPair {
    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
    });

    return { accessToken, refreshToken };
  }

  public static formatUser(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }

  public static async getSetupStatus(): Promise<{ hasAdmin: boolean }> {
    const count = await User.countDocuments();
    return { hasAdmin: count > 0 };
  }

  public static async registerFirstUser(data: { email: string; password: string }): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      throw new ForbiddenError('Registration is disabled. The administrator account has already been created.');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: 'admin'
    });

    const tokens = this.generateTokens(user);
    return { user: this.formatUser(user), tokens };
  }

  public static async login(data: { email: string; password: string }): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const user = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    return { user: this.formatUser(user), tokens };
  }

  public static async refresh(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthUserPayload;
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedError('User account not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  public static async getMe(userId: string): Promise<UserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return this.formatUser(user);
  }
}

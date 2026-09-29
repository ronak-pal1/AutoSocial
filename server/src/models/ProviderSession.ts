import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ProviderType = 'gemini' | 'chatgpt';
export type ProviderSessionStatus = 'connected' | 'login_required' | 'disconnected' | 'error';
export type SessionStatus = ProviderSessionStatus;

export interface IProviderSession extends Document {
  provider: ProviderType;
  status: ProviderSessionStatus;
  lastCheckedAt?: Date;
  profilePath: string;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSessionSchema = new Schema<IProviderSession>(
  {
    provider: {
      type: String,
      enum: ['gemini', 'chatgpt'],
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['connected', 'login_required', 'disconnected', 'error'],
      default: 'login_required',
      index: true
    },
    lastCheckedAt: {
      type: Date
    },
    profilePath: {
      type: String,
      required: true
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const ProviderSession: Model<IProviderSession> =
  mongoose.models.ProviderSession || mongoose.model<IProviderSession>('ProviderSession', ProviderSessionSchema);

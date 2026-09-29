import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IMcpApiKey extends Document {
  name: string;
  hashedKey: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  revoked: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const McpApiKeySchema = new Schema<IMcpApiKey>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    hashedKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    keyPrefix: {
      type: String,
      required: true
    },
    lastUsedAt: {
      type: Date
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

export const McpApiKey: Model<IMcpApiKey> =
  mongoose.models.McpApiKey || mongoose.model<IMcpApiKey>('McpApiKey', McpApiKeySchema);

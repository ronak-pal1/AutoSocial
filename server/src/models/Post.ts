import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type PostPlatform = 'linkedin' | 'twitter';
export type PostStatus = 'draft' | 'ready' | 'posted' | 'archived';

export interface ITwitterTweet {
  order: number;
  text: string;
  imageIds?: string[];
}

export interface ITwitterPayload {
  thread: ITwitterTweet[];
}

export interface ILinkedInPayload {
  body: string;
  hashtags?: string[];
  imageIds?: string[];
  hook?: string;
}

export interface IPost extends Document {
  platform: PostPlatform;
  status: PostStatus;
  title: string;
  topic: string;
  tags: string[];
  campaignId?: Types.ObjectId;
  images: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  source: 'portal' | 'mcp';
  postedAt?: Date;
  externalUrl?: string;
  payload: ITwitterPayload | ILinkedInPayload;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    platform: {
      type: String,
      enum: ['linkedin', 'twitter'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'ready', 'posted', 'archived'],
      default: 'draft',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      index: true
    },
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image'
      }
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['portal', 'mcp'],
      default: 'portal'
    },
    postedAt: {
      type: Date
    },
    externalUrl: {
      type: String,
      trim: true
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

PostSchema.index({ createdAt: -1 });

export const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

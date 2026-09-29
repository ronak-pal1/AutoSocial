import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IImage extends Document {
  storage: 'local' | 'gridfs' | 's3';
  filePath: string;
  filename: string;
  mime: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  prompt: string;
  jobId?: Types.ObjectId;
  url: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    storage: {
      type: String,
      enum: ['local', 'gridfs', 's3'],
      default: 'local'
    },
    filePath: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    mime: {
      type: String,
      required: true,
      default: 'image/jpeg'
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    sizeBytes: {
      type: Number
    },
    prompt: {
      type: String,
      required: true
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      index: true
    },
    url: {
      type: String,
      required: true
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

ImageSchema.index({ createdAt: -1 });

export const ImageModel: Model<IImage> =
  mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);

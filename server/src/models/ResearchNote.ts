import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IResearchNote extends Document {
  title: string;
  content: string;
  sources: string[];
  tags: string[];
  createdBy?: Types.ObjectId;
  source: 'portal' | 'mcp';
  createdAt: Date;
  updatedAt: Date;
}

const ResearchNoteSchema = new Schema<IResearchNote>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    sources: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['portal', 'mcp'],
      default: 'portal'
    }
  },
  {
    timestamps: true
  }
);

ResearchNoteSchema.index({ createdAt: -1 });

export const ResearchNote: Model<IResearchNote> =
  mongoose.models.ResearchNote || mongoose.model<IResearchNote>('ResearchNote', ResearchNoteSchema);

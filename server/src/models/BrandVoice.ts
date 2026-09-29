import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IBrandVoice extends Document {
  tone: string;
  niche: string;
  audience: string;
  dos: string[];
  donts: string[];
  samplePosts: string[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BrandVoiceSchema = new Schema<IBrandVoice>(
  {
    tone: {
      type: String,
      default: 'Authoritative, insightful, accessible, and high-energy.'
    },
    niche: {
      type: String,
      default: 'Artificial Intelligence, SaaS engineering, developer tools, and workflow automation.'
    },
    audience: {
      type: String,
      default: 'Founders, senior software engineers, tech creators, and product builders.'
    },
    dos: {
      type: [String],
      default: [
        'Lead with strong punchy hooks',
        'Use clean formatting with bullet points and line breaks',
        'Include practical metrics, code insights, or architecture diagrams',
        'End with conversational questions or clear calls-to-action'
      ]
    },
    donts: {
      type: [String],
      default: [
        'Never use generic AI buzzwords like "unleash", "game-changer", "tapestry"',
        'Avoid wall of texts without paragraph breaks',
        'No clickbait without delivering real substance'
      ]
    },
    samplePosts: {
      type: [String],
      default: []
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

export const BrandVoice: Model<IBrandVoice> =
  mongoose.models.BrandVoice || mongoose.model<IBrandVoice>('BrandVoice', BrandVoiceSchema);

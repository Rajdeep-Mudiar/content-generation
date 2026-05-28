import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  category: { type: String, required: true },
  platform: { type: String, enum: ['Quora', 'LinkedIn', 'Medium'], required: true },
  generatedContent: { type: String, required: true },
  hashtags: [{ type: String }],
  cta: { type: String },
  seoTitle: { type: String },
  seoDescription: { type: String },
  keywords: [{ type: String }],
  imagePrompt: { type: String },
  thumbnailIdea: { type: String },
  status: { type: String, enum: ['draft', 'published', 'synced', 'failed'], default: 'draft' },
  provider: { type: String },
  generationTime: { type: Number }, // in ms
  notionPageId: { type: String },
}, { timestamps: true });

export const Content = mongoose.model('Content', contentSchema);

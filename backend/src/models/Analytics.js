import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalGenerated: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  providerUsage: {
    groq: { type: Number, default: 0 },
    gemini: { type: Number, default: 0 }
  },
  tokenUsage: { type: Number, default: 0 },
  avgGenerationTime: { type: Number, default: 0 },
  platformStats: {
    Quora: { type: Number, default: 0 },
    LinkedIn: { type: Number, default: 0 },
    Medium: { type: Number, default: 0 }
  },
  categoryStats: { type: Map, of: Number, default: {} },
  apiFailures: { type: Number, default: 0 }
}, { timestamps: true });

export const Analytics = mongoose.model('Analytics', analyticsSchema);

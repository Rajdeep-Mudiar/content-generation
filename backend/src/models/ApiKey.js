import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['groq', 'gemini', 'deepseek'], required: true },
  label: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'failed', 'cooldown'], default: 'active' },
  failureCount: { type: Number, default: 0 },
  lastUsed: { type: Date },
  lastError: { type: String },
  requestCount: { type: Number, default: 0 },
  tokenUsage: { type: Number, default: 0 },
  avgLatency: { type: Number, default: 0 },
  cooldownUntil: { type: Date },
}, { timestamps: true });

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);

import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'warn', 'error', 'debug'], default: 'info' },
  message: { type: String, required: true },
  context: { type: String }, // 'cron', 'api', 'ai_gen', 'notion'
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export const Log = mongoose.model('Log', logSchema);

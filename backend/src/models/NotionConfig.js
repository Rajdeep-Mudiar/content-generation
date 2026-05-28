import mongoose from 'mongoose';

const notionConfigSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  databaseId: { type: String },
  workspaceName: { type: String },
  workspaceIcon: { type: String },
  isConnected: { type: Boolean, default: false },
  lastSynced: { type: Date },
  syncSettings: {
    autoSync: { type: Boolean, default: true },
    platforms: [{ type: String, enum: ['Quora', 'LinkedIn', 'Medium'] }]
  }
}, { timestamps: true });

export const NotionConfig = mongoose.model('NotionConfig', notionConfigSchema);

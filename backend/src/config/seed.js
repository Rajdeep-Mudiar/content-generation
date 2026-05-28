import { ApiKey } from '../models/ApiKey.js';
import { dbLogger } from '../utils/logger.js';

export const seedApiKeys = async () => {
  try {
    const keysFromEnv = [];

    // Parse Groq Keys
    if (process.env.GROQ_KEYS) {
      process.env.GROQ_KEYS.split(',').forEach((key, index) => {
        keysFromEnv.push({
          key: key.trim(),
          provider: 'groq',
          label: `Groq Key ${index + 1} (Env)`
        });
      });
    }

    // Parse Gemini Keys
    if (process.env.GEMINI_API_KEYS) {
      process.env.GEMINI_API_KEYS.split(',').forEach((key, index) => {
        keysFromEnv.push({
          key: key.trim(),
          provider: 'gemini',
          label: `Gemini Key ${index + 1} (Env)`
        });
      });
    }

    // Parse DeepSeek Keys
    if (process.env.DEEPSEEK_KEYS) {
      process.env.DEEPSEEK_KEYS.split(',').forEach((key, index) => {
        keysFromEnv.push({
          key: key.trim(),
          provider: 'deepseek',
          label: `DeepSeek Key ${index + 1} (Env)`
        });
      });
    }

    let addedCount = 0;
    let reactivatedCount = 0;

    for (const keyData of keysFromEnv) {
      const existingKey = await ApiKey.findOne({ key: keyData.key });
      
      if (!existingKey) {
        await ApiKey.create({
          ...keyData,
          status: 'active'
        });
        addedCount++;
      } else if (existingKey.status !== 'active') {
        // If the key exists but was failed/cooldown, reactivate it since it's in .env
        existingKey.status = 'active';
        existingKey.failureCount = 0;
        await existingKey.save();
        reactivatedCount++;
      }
    }

    if (addedCount > 0 || reactivatedCount > 0) {
      await dbLogger('info', `Env Sync: Added ${addedCount} new keys, reactivated ${reactivatedCount} keys`, 'system_init');
      console.log(`Synced keys from .env: ${addedCount} added, ${reactivatedCount} reactivated.`);
    } else {
      console.log('API keys in database are already up to date with .env');
    }

    // Sync Notion Token from .env
    if (process.env.NOTION_TOKEN) {
      const { NotionConfig } = await import('../models/NotionConfig.js');
      const existingConfig = await NotionConfig.findOne();
      if (!existingConfig) {
        await NotionConfig.create({
          accessToken: process.env.NOTION_TOKEN,
          isConnected: true,
          syncSettings: { autoSync: true, platforms: ['Quora', 'LinkedIn', 'Medium'] }
        });
        console.log('Notion configuration seeded from .env');
      } else if (existingConfig.accessToken !== process.env.NOTION_TOKEN) {
        existingConfig.accessToken = process.env.NOTION_TOKEN;
        existingConfig.isConnected = true;
        await existingConfig.save();
        console.log('Notion configuration updated from .env');
      }
    }

  } catch (error) {
    console.error('Failed to sync API keys from .env:', error);
    await dbLogger('error', 'Failed to sync API keys from .env', 'system_init', { error: error.message });
  }
};

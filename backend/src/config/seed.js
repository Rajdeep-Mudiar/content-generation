import { ApiKey } from '../models/ApiKey.js';
import { dbLogger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

export const seedApiKeys = async () => {
  try {
    const existingCount = await ApiKey.countDocuments();
    if (existingCount > 0) {
      console.log('API keys already exist in database, skipping seed.');
      return;
    }

    const keysToSeed = [];

    // Groq Keys
    if (process.env.GROQ_KEYS) {
      const groqKeys = process.env.GROQ_KEYS.split(',');
      groqKeys.forEach((key, index) => {
        keysToSeed.push({
          key: key.trim(),
          provider: 'groq',
          label: `Groq Key ${index + 1} (Env)`,
          status: 'active'
        });
      });
    }

    // Gemini Keys
    if (process.env.GEMINI_API_KEYS) {
      const geminiKeys = process.env.GEMINI_API_KEYS.split(',');
      geminiKeys.forEach((key, index) => {
        keysToSeed.push({
          key: key.trim(),
          provider: 'gemini',
          label: `Gemini Key ${index + 1} (Env)`,
          status: 'active'
        });
      });
    }

    // DeepSeek Keys
    if (process.env.DEEPSEEK_KEYS) {
      const deepseekKeys = process.env.DEEPSEEK_KEYS.split(',');
      deepseekKeys.forEach((key, index) => {
        keysToSeed.push({
          key: key.trim(),
          provider: 'deepseek',
          label: `DeepSeek Key ${index + 1} (Env)`,
          status: 'active'
        });
      });
    }

    if (keysToSeed.length > 0) {
      await ApiKey.insertMany(keysToSeed);
      await dbLogger('info', `Successfully seeded ${keysToSeed.length} API keys from .env`, 'system_init');
      console.log(`Seeded ${keysToSeed.length} API keys from .env`);
    }

  } catch (error) {
    console.error('Failed to seed API keys:', error);
    await dbLogger('error', 'Failed to seed API keys from .env', 'system_init', { error: error.message });
  }
};

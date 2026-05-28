import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiKey } from '../models/ApiKey.js';
import { dbLogger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

class ProviderManager {
  constructor() {
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    this.maxFailures = 3;
  }

  async getActiveKeys(provider) {
    const now = new Date();
    return await ApiKey.find({
      provider,
      status: { $in: ['active', 'cooldown'] },
      $or: [
        { cooldownUntil: { $exists: false } },
        { cooldownUntil: { $lte: now } }
      ]
    }).sort({ lastUsed: 1 }); // Round robin: use least recently used
  }

  async markKeyFailure(keyId, error) {
    const key = await ApiKey.findById(keyId);
    if (!key) return;

    key.failureCount += 1;
    key.lastError = error.message || 'Unknown error';
    
    if (key.failureCount >= this.maxFailures) {
      key.status = 'failed';
      await dbLogger('error', `API Key ${keyId} disabled after ${this.maxFailures} failures`, 'ai_provider', { error: error.message });
    } else {
      key.status = 'cooldown';
      key.cooldownUntil = new Date(Date.now() + this.cooldownPeriod);
      await dbLogger('warn', `API Key ${keyId} put on cooldown`, 'ai_provider', { error: error.message });
    }
    
    await key.save();
  }

  async markKeySuccess(keyId, latency, tokens) {
    await ApiKey.findByIdAndUpdate(keyId, {
      status: 'active',
      failureCount: 0,
      lastUsed: new Date(),
      $inc: { requestCount: 1, tokenUsage: tokens || 0 },
      // Update average latency (simplified)
      avgLatency: latency 
    });
  }

  async generateWithDeepSeek(prompt, keys) {
    for (const keyDoc of keys) {
      const startTime = Date.now();
      try {
        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
          },
          {
            headers: {
              'Authorization': `Bearer ${keyDoc.key}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        );

        const latency = Date.now() - startTime;
        const tokens = response.data.usage?.total_tokens || 0;
        await this.markKeySuccess(keyDoc._id, latency, tokens);
        
        return {
          content: response.data.choices[0].message.content,
          provider: 'deepseek',
          latency,
          tokens
        };
      } catch (error) {
        await this.markKeyFailure(keyDoc._id, error);
        continue;
      }
    }
    return null;
  }

  async generateWithGroq(prompt, keys) {
    for (const keyDoc of keys) {
      const startTime = Date.now();
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'mixtral-8x7b-32768',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
          },
          {
            headers: {
              'Authorization': `Bearer ${keyDoc.key}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const latency = Date.now() - startTime;
        const tokens = response.data.usage?.total_tokens || 0;
        await this.markKeySuccess(keyDoc._id, latency, tokens);
        
        return {
          content: response.data.choices[0].message.content,
          provider: 'groq',
          latency,
          tokens
        };
      } catch (error) {
        await this.markKeyFailure(keyDoc._id, error);
        continue;
      }
    }
    return null;
  }

  async generateWithGemini(prompt, keys) {
    for (const keyDoc of keys) {
      const startTime = Date.now();
      try {
        const genAI = new GoogleGenerativeAI(keyDoc.key);
        // Try the configured model first, then fallback
        const models = [
          process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-pro'
        ];

        let text = '';
        let success = false;
        
        for (const modelName of models) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
            if (text) {
              success = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!success) throw new Error('Gemini failed with all models');

        const latency = Date.now() - startTime;
        await this.markKeySuccess(keyDoc._id, latency, 0);

        return {
          content: text,
          provider: 'gemini',
          latency,
          tokens: 0
        };
      } catch (error) {
        await this.markKeyFailure(keyDoc._id, error);
        continue;
      }
    }
    return null;
  }

  async generateContent(prompt) {
    // 1. Try DeepSeek first (as it was added to .env)
    const dsKeys = await this.getActiveKeys('deepseek');
    if (dsKeys.length > 0) {
      const result = await this.generateWithDeepSeek(prompt, dsKeys);
      if (result) return result;
    }

    // 2. Try Groq
    const groqKeys = await this.getActiveKeys('groq');
    if (groqKeys.length > 0) {
      const result = await this.generateWithGroq(prompt, groqKeys);
      if (result) return result;
    }

    // 3. Fallback to Gemini
    const geminiKeys = await this.getActiveKeys('gemini');
    if (geminiKeys.length > 0) {
      const result = await this.generateWithGemini(prompt, geminiKeys);
      if (result) return result;
    }

    throw new Error('All AI providers and keys failed or are unavailable');
  }
}

export default new ProviderManager();

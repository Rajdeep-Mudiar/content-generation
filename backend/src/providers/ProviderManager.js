import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiKey } from '../models/ApiKey.js';
import { dbLogger } from '../utils/logger.js';

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

    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';

    key.failureCount += 1;
    key.lastError = errorMessage;
    
    // If it's a 401 (Unauthorized) or 402 (Payment Required), disable the key immediately
    if (statusCode === 401 || statusCode === 402) {
      key.status = 'failed';
      await dbLogger('error', `API Key ${keyId} disabled: ${statusCode} ${errorMessage}`, 'ai_provider', { statusCode, error: errorMessage });
    } else if (key.failureCount >= this.maxFailures) {
      key.status = 'failed';
      await dbLogger('error', `API Key ${keyId} disabled after ${this.maxFailures} failures`, 'ai_provider', { error: errorMessage });
    } else {
      key.status = 'cooldown';
      // Exponential backoff for cooldown: 5min, 15min, 30min
      const backoffMultiplier = Math.min(key.failureCount, 3);
      key.cooldownUntil = new Date(Date.now() + this.cooldownPeriod * backoffMultiplier);
      await dbLogger('warn', `API Key ${keyId} put on cooldown (${backoffMultiplier}x)`, 'ai_provider', { error: errorMessage });
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
            messages: [{ role: 'system', content: 'You are a professional content creator.' }, { role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: 'json_object' }
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
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: 'You are a professional content creator. Always respond in valid JSON.' }, { role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: 'json_object' }
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
        const models = [
          process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro'
        ];

        let text = '';
        let success = false;
        let lastErr = null;
        
        for (const modelName of models) {
          try {
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
            if (text) {
              success = true;
              break;
            }
          } catch (e) {
            lastErr = e;
            continue;
          }
        }

        if (!success) throw lastErr || new Error('Gemini failed with all models');

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

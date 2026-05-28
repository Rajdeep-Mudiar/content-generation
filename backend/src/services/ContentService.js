import { Content } from '../models/Content.js';
import { Analytics } from '../models/Analytics.js';
import ProviderManager from '../providers/ProviderManager.js';
import { getPromptForPlatform, TOPICS } from '../prompts/promptTemplates.js';
import { dbLogger } from '../utils/logger.js';
import NotionService from './NotionService.js';

class ContentService {
  async generateDailyContent() {
    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pick a random topic for the day
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const platforms = ['Quora', 'LinkedIn', 'Medium'];

    await dbLogger('info', `Starting daily content generation for topic: ${topic}`, 'content_gen');

    for (const platform of platforms) {
      let success = false;
      let attempts = 0;
      const maxAttempts = 2; // Retry the whole platform generation once if it fails

      while (!success && attempts < maxAttempts) {
        attempts++;
        try {
          const prompt = getPromptForPlatform(platform, topic);
          const aiResponse = await ProviderManager.generateContent(prompt);
          
          let parsedContent;
          try {
            const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
            parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.content);
          } catch (e) {
            throw new Error(`Failed to parse AI response as JSON for ${platform}. Raw: ${aiResponse.content.substring(0, 100)}...`);
          }

          const newContent = await Content.create({
            ...parsedContent,
            topic,
            category: topic,
            platform,
            generatedContent: parsedContent.content || parsedContent.generatedContent,
            provider: aiResponse.provider,
            generationTime: aiResponse.latency,
            status: 'draft'
          });

          // Sync to Notion if configured
          try {
            const notionPage = await NotionService.syncToNotion(newContent);
            if (notionPage) {
              newContent.notionPageId = notionPage.id;
              newContent.status = 'synced';
              await newContent.save();
            }
          } catch (notionErr) {
            await dbLogger('error', `Notion sync failed for ${newContent._id}`, 'notion_sync', { error: notionErr.message });
          }

          results.push(newContent);
          await this.updateAnalytics(aiResponse, platform, topic);
          success = true;
        } catch (error) {
          await dbLogger('error', `Content generation failed for ${platform} (Attempt ${attempts}/${maxAttempts})`, 'content_gen', { error: error.message });
          if (attempts >= maxAttempts) {
            // Final failure for this platform
            continue;
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return results;
  }

  async updateAnalytics(aiResponse, platform, topic) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      let analytics = await Analytics.findOne({ date: today });
      if (!analytics) {
        analytics = new Analytics({ date: today });
      }

      analytics.totalGenerated += 1;
      analytics.providerUsage[aiResponse.provider] += 1;
      analytics.tokenUsage += aiResponse.tokens || 0;
      analytics.platformStats[platform] += 1;
      
      const currentCatStats = analytics.categoryStats.get(topic) || 0;
      analytics.categoryStats.set(topic, currentCatStats + 1);

      // Simple moving average for generation time
      analytics.avgGenerationTime = (analytics.avgGenerationTime * (analytics.totalGenerated - 1) + aiResponse.latency) / analytics.totalGenerated;

      await analytics.save();
    } catch (err) {
      console.error('Failed to update analytics:', err);
    }
  }
}

export default new ContentService();

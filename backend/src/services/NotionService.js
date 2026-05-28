import { Client } from '@notionhq/client';
import { NotionConfig } from '../models/NotionConfig.js';
import { dbLogger } from '../utils/logger.js';

class NotionService {
  async getClient() {
    const config = await NotionConfig.findOne({ isConnected: true });
    if (!config || !config.accessToken) {
      return null;
    }
    return {
      client: new Client({ auth: config.accessToken }),
      databaseId: config.databaseId
    };
  }

  async syncToNotion(content) {
    const connection = await this.getClient();
    if (!connection) return null;

    const { client, databaseId } = connection;
    if (!databaseId) return null;

    try {
      const response = await client.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Title: {
            title: [{ text: { content: content.title } }]
          },
          Platform: {
            select: { name: content.platform }
          },
          Topic: {
            select: { name: content.topic }
          },
          Status: {
            status: { name: 'Published' }
          },
          'Generated Date': {
            date: { start: new Date().toISOString() }
          },
          Hashtags: {
            multi_select: content.hashtags.map(h => ({ name: h.replace('#', '') }))
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: content.generatedContent.substring(0, 2000) } }]
            }
          }
        ]
      });

      await dbLogger('info', `Synced content to Notion: ${content._id}`, 'notion_sync');
      return response;
    } catch (error) {
      await dbLogger('error', `Notion API error for content ${content._id}`, 'notion_sync', { error: error.message });
      throw error;
    }
  }

  async testConnection(accessToken) {
    try {
      const client = new Client({ auth: accessToken });
      const response = await client.users.me({});
      return response;
    } catch (error) {
      throw new Error(`Notion connection failed: ${error.message}`);
    }
  }

  async getDatabases(accessToken) {
    try {
      const client = new Client({ auth: accessToken });
      const response = await client.search({
        filter: { property: 'object', value: 'database' }
      });
      return response.results.map(db => ({
        id: db.id,
        title: db.title[0]?.plain_text || 'Untitled'
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Notion databases: ${error.message}`);
    }
  }
}

export default new NotionService();

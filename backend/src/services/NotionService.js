import { Client } from '@notionhq/client';
import { NotionConfig } from '../models/NotionConfig.js';
import { dbLogger } from '../utils/logger.js';

class NotionService {
  async getClient() {
    let config = await NotionConfig.findOne({ isConnected: true });
    
    // Fallback to process.env if no DB config or not connected
    const token = config?.accessToken || process.env.NOTION_TOKEN;
    const databaseId = config?.databaseId || process.env.NOTION_DATABASE_ID;

    if (!token) {
      return null;
    }

    return {
      client: new Client({ auth: token }),
      databaseId: databaseId
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
      console.log('Fetching databases with token starting with:', accessToken.substring(0, 7));
      const client = new Client({ auth: accessToken });
      const response = await client.search({
        page_size: 100
      });
      
      console.log(`Found ${response.results.length} total items in search`);

      return response.results
        .filter(item => item.object === 'database') // Manually filter for databases to avoid validation errors
        .map(db => {
          try {
            let title = 'Untitled';
            
            // Check top-level title array (most common)
            if (db.title && Array.isArray(db.title) && db.title.length > 0) {
              title = db.title[0].plain_text || 'Untitled';
            } 
            // Check properties (inline databases sometimes have it here)
            else if (db.properties) {
              const titleProp = Object.values(db.properties).find(p => p.type === 'title');
              if (titleProp && titleProp.title && titleProp.title.length > 0) {
                title = titleProp.title[0].plain_text || 'Untitled';
              }
            }

            return {
              id: db.id,
              title: title
            };
          } catch (mapErr) {
            console.error('Error mapping individual database:', db.id, mapErr);
            return { id: db.id, title: 'Error parsing title' };
          }
        });
    } catch (error) {
      console.error('Notion SDK Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      // Re-throw with preserved status if available
      const customError = new Error(error.message);
      if (error.code === 'unauthorized') customError.message = 'Invalid Notion Token. Please check your .env or entry.';
      customError.status = error.status;
      customError.code = error.code;
      
      throw customError;
    }
  }

  async findOrCreateDatabase(accessToken) {
    const client = new Client({ auth: accessToken });
    
    try {
      console.log('Auto-setup: Starting search for "ai-content-generation"...');
      
      const searchResponse = await client.search({
        query: 'ai-content-generation',
        page_size: 100
      });

      console.log(`Auto-setup: Search returned ${searchResponse.results?.length || 0} items`);

      if (!searchResponse.results || searchResponse.results.length === 0) {
        const error = new Error('No items found in Notion search. Please ensure the page "ai-content-generation" exists and is SHARED with the integration.');
        error.status = 404;
        throw error;
      }

      // Find the page specifically
      const page = searchResponse.results.find(res => {
        // Check if it's a page or a database that looks like the target
        if (res.object !== 'page' && res.object !== 'database') return false;
        
        let title = '';
        if (res.object === 'page') {
          // Try properties.title (standard pages) or properties.Name (database pages)
          const titleProp = res.properties?.title || res.properties?.Name;
          title = titleProp?.title?.[0]?.plain_text || '';
          
          // Fallback for some page types
          if (!title && res.title) {
            title = Array.isArray(res.title) ? res.title[0]?.plain_text : '';
          }
        } else if (res.object === 'database') {
          title = res.title?.[0]?.plain_text || '';
        }
        
        const isMatch = title.toLowerCase().includes('ai-content-generation');
        if (isMatch) console.log(`Auto-setup: Matched ${res.object} with title "${title}"`);
        return isMatch;
      });

      if (!page) {
        const error = new Error('Could not find a page named "ai-content-generation". Make sure you named it exactly and shared it with the integration.');
        error.status = 404;
        throw error;
      }

      // If we already found a database, return it
      if (page.object === 'database') {
        console.log('Auto-setup: Found existing database directly:', page.id);
        return { id: page.id, title: 'AI Generated Content', pageId: page.id };
      }

      // 2. Check if a database already exists in this page's children
      console.log('Auto-setup: Checking children of page:', page.id);
      let blocks;
      try {
        blocks = await client.blocks.children.list({ block_id: page.id });
      } catch (blockErr) {
        console.error('Auto-setup: Error listing children:', blockErr.message);
        // If we can't list children, we might not have permission or it's not a block-parent
        // Proceed to try creating a database anyway, which might fail or succeed depending on permissions
        blocks = { results: [] };
      }
      
      const existingDb = blocks.results.find(block => block.type === 'child_database');

      if (existingDb) {
        console.log('Auto-setup: Found existing database in children:', existingDb.id);
        return { id: existingDb.id, title: existingDb.child_database.title, pageId: page.id };
      }

      // 3. Create a new database if not found
      console.log('Auto-setup: Creating new database inside page:', page.id);
      try {
        const newDb = await client.databases.create({
          parent: { page_id: page.id },
          title: [{ type: 'text', text: { content: 'AI Generated Content' } }],
          properties: {
            Title: { title: {} },
            Platform: {
              select: {
                options: [
                  { name: 'Quora', color: 'red' },
                  { name: 'LinkedIn', color: 'blue' },
                  { name: 'Medium', color: 'black' }
                ]
              }
            },
            Topic: { select: {} },
            Status: {
              status: {
                options: [
                  { name: 'Draft', color: 'gray' },
                  { name: 'Published', color: 'green' }
                ]
              }
            },
            'Generated Date': { date: {} },
            Hashtags: { multi_select: {} }
          }
        });

        console.log('Auto-setup: Successfully created database:', newDb.id);
        return { id: newDb.id, title: 'AI Generated Content', pageId: page.id };
      } catch (createErr) {
        console.error('Auto-setup: Error creating database:', createErr.message);
        const error = new Error(`Failed to create database: ${createErr.message}. Make sure the integration has "Insert Content" permission.`);
        error.status = 403;
        throw error;
      }
    } catch (error) {
      console.error('Auto-setup Critical Error:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw error;
    }
  }
}

export default new NotionService();

import { NotionConfig } from '../models/NotionConfig.js';
import NotionService from '../services/NotionService.js';

export const getNotionConfig = async (req, res) => {
  try {
    const config = await NotionConfig.findOne();
    const configObj = config ? config.toObject() : {};
    
    // If no token in DB, check if it's in .env to help the frontend
    if (!configObj.accessToken && process.env.NOTION_TOKEN) {
      configObj.accessToken = process.env.NOTION_TOKEN;
      configObj.isFromEnv = true;
    }
    
    res.json(configObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotionConfig = async (req, res) => {
  try {
    const { accessToken, databaseId, isConnected, syncSettings } = req.body;
    
    let config = await NotionConfig.findOne();
    if (config) {
      config.accessToken = accessToken || config.accessToken;
      config.databaseId = databaseId || config.databaseId;
      config.isConnected = isConnected !== undefined ? isConnected : config.isConnected;
      config.syncSettings = syncSettings || config.syncSettings;
      await config.save();
    } else {
      config = await NotionConfig.create({
        accessToken,
        databaseId,
        isConnected,
        syncSettings
      });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchDatabases = async (req, res) => {
  try {
    const { accessToken } = req.query;
    let token = accessToken || process.env.NOTION_TOKEN;
    
    if (token) {
      token = token.trim();
    }
    
    if (!token) {
      return res.status(400).json({ message: 'Access token required (provide in UI or .env)' });
    }

    const databases = await NotionService.getDatabases(token);
    res.json(databases);
  } catch (error) {
    console.error('Fetch Notion databases controller error:', error);
    res.status(error.status || 500).json({ 
      message: error.message || 'Failed to fetch Notion databases',
      code: error.code
    });
  }
};

export const autoSetupNotion = async (req, res) => {
  try {
    const { accessToken } = req.body;
    let token = accessToken || process.env.NOTION_TOKEN;

    if (token) {
      token = token.trim();
    }

    if (!token) {
      return res.status(400).json({ message: 'Access token required' });
    }

    const result = await NotionService.findOrCreateDatabase(token);
    
    // Automatically update the config with the found/created database
    let config = await NotionConfig.findOne();
    if (config) {
      config.accessToken = token;
      config.databaseId = result.id;
      config.isConnected = true;
      await config.save();
    } else {
      await NotionConfig.create({
        accessToken: token,
        databaseId: result.id,
        isConnected: true
      });
    }

    res.json({
      message: 'Successfully connected and setup Notion database',
      database: result
    });
  } catch (error) {
    console.error('Auto setup Notion controller error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to auto-setup Notion',
      code: error.code
    });
  }
};

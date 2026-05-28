import { NotionConfig } from '../models/NotionConfig.js';
import NotionService from '../services/NotionService.js';

export const getNotionConfig = async (req, res) => {
  try {
    const config = await NotionConfig.findOne();
    res.json(config || {});
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
    if (!accessToken) return res.status(400).json({ message: 'Access token required' });
    const databases = await NotionService.getDatabases(accessToken);
    res.json(databases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

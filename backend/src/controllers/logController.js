import { Log } from '../models/Log.js';

export const getLogs = async (req, res) => {
  try {
    const { level, context, limit = 50 } = req.query;
    const query = {};
    if (level) query.level = level;
    if (context) query.context = context;

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

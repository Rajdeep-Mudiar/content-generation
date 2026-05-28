import { ApiKey } from '../models/ApiKey.js';

export const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find().sort({ createdAt: -1 });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addApiKey = async (req, res) => {
  try {
    const { key, provider, label } = req.body;
    const newKey = await ApiKey.create({ key, provider, label });
    res.status(201).json(newKey);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApiKey = async (req, res) => {
  try {
    const { status, label } = req.body;
    const key = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { status, label },
      { new: true }
    );
    if (!key) return res.status(404).json({ message: 'Key not found' });
    res.json(key);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const key = await ApiKey.findByIdAndDelete(req.params.id);
    if (!key) return res.status(404).json({ message: 'Key not found' });
    res.json({ message: 'Key deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import { Analytics } from '../models/Analytics.js';

export const getAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const stats = await Analytics.find({ date: { $gte: dateLimit } }).sort({ date: 1 });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await Analytics.findOne({ date: today });
    const totalGenerated = await Analytics.aggregate([
      { $group: { _id: null, total: { $sum: '$totalGenerated' } } }
    ]);

    res.json({
      today: todayStats || { totalGenerated: 0, providerUsage: { groq: 0, gemini: 0 }, platformStats: { Quora: 0, LinkedIn: 0, Medium: 0 } },
      overallTotal: totalGenerated[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

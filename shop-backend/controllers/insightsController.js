const Insight = require('../models/Insight');
const { chatCompletion } = require('../services/openai');

exports.getInsights = async (req, res, next) => {
  try {
    const latestDaily = await Insight.findOne({ kind: 'daily' }).sort({ createdAt: -1 }).lean();
    const latestAnomaly = await Insight.findOne({ kind: 'anomaly' }).sort({ createdAt: -1 }).lean();
    const latestForecast = await Insight.findOne({ kind: 'forecast' }).sort({ createdAt: -1 }).lean();

    let aiSummary = null;
    try {
      const payload = { daily: latestDaily?.payload, anomaly: latestAnomaly?.payload, forecast: latestForecast?.payload };
      const msg = await chatCompletion([
        { role: 'system', content: 'Summarize shop performance briefly in Persian for an admin. 1-3 sentences. Include key changes and forecast.' },
        { role: 'user', content: JSON.stringify(payload) }
      ], { temperature: 0.2 });
      aiSummary = msg?.content || null;
    } catch(_) {}

    return res.success({ daily: latestDaily, anomaly: latestAnomaly, forecast: latestForecast, aiSummary });
  } catch (err) { next(err); }
};



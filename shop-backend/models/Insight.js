const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  kind: { type: String, enum: ['daily', 'trend', 'anomaly', 'forecast'], required: true },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  payload: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);



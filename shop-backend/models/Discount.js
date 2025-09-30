const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  percent: { type: Number, min: 1, max: 100 },
  amount: { type: Number, min: 0 },
  expiresAt: { type: Date },
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Discount', discountSchema);



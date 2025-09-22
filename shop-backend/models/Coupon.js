const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  percent: { type: Number }, // 0-100
  amount: { type: Number },  // fixed discount
  maxUse: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  minAmount: { type: Number, default: 0 },
  categories: [{ type: String }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);







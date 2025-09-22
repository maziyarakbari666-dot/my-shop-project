const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false }
}, { timestamps: true });

otpSchema.index({ phone: 1, createdAt: -1 });

module.exports = mongoose.model('Otp', otpSchema);







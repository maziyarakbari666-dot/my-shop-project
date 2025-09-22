const mongoose = require('mongoose');

const courierMessageSchema = new mongoose.Schema({
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  whatsappMessageId: { type: String },
  toPhone: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['sent','deleted','failed','fallback'], default: 'sent' },
  error: { type: String }
}, { timestamps: true });

courierMessageSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model('CourierMessage', courierMessageSchema);



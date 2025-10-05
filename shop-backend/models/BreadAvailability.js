const mongoose = require('mongoose');

const breadAvailabilitySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  date: { type: Date, required: true }, // normalized to start of day
  fromTime: { type: Date, required: true },
  toTime: { type: Date, required: true },
  isAvailable: { type: Boolean, default: true },
  quantity: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
}, { timestamps: true });

breadAvailabilitySchema.index({ productId: 1, date: 1 });
breadAvailabilitySchema.index({ fromTime: 1, toTime: 1 });

module.exports = mongoose.model('BreadAvailability', breadAvailabilitySchema);






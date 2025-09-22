const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

courierSchema.index({ active: 1 });
courierSchema.index({ name: 1 });

module.exports = mongoose.model('Courier', courierSchema);



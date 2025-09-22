const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String },
  description: { type: String },
  stock: { type: Number, default: 0 },
  // درصد تخفیف (۰ تا ۱۰۰). در صورت >۰ قیمت نهایی بر اساس آن محاسبه می‌شود
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  active: { type: Boolean, default: true },
  pauseTimes: [{ from: String, to: String }],
  reviews: [{
    user: { type: String },
    text: { type: String },
    status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
module.exports = mongoose.model('Product', productSchema);
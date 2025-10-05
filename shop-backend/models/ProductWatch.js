const mongoose = require('mongoose');

const productWatchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['restock', 'discount'], required: true },
  fulfilled: { type: Boolean, default: false },
  meta: { type: Object },
}, { timestamps: true, indexes: [{ user: 1, product: 1, type: 1, unique: true }] });

productWatchSchema.index({ user: 1, product: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('ProductWatch', productWatchSchema);






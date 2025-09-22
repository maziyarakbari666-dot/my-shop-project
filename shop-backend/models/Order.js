const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  orderNumber: { type: String, unique: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number } // unit price at order time (optional for legacy)
  }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  // Contact and address details (guest-friendly)
  contactPhone: { type: String },
  contactName: { type: String },
  address: { type: String },
  region: { type: String },
  plaque: { type: String },
  unit: { type: String },
  // Delivery scheduling
  deliveryDate: { type: Date },
  deliverySlot: { type: String }, // e.g., "10 تا 11"
  // Pricing breakdown
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['online', 'cod', 'bnpl'], default: 'online' },
  cancelReason: { type: String },
  paidAt: { type: Date }
}, { timestamps: true });

// Generate incremental readable order number, e.g., ORD-1023
orderSchema.pre('save', async function(next) {
  if (this.orderNumber) return next();
  try {
    const Counter = require('./Counter');
    const c = await Counter.findOneAndUpdate(
      { key: 'order' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const seq = c.seq;
    this.orderNumber = `ORD-${seq}`;
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = mongoose.model('Order', orderSchema);
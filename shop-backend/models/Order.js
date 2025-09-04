const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['online', 'cash', 'credit'], default: 'online' },
  status: { type: String, enum: ['pending', 'accepted', 'cancelled', 'delivered'], default: 'pending' },
  cancelReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  deliveryTime: { type: Date }
});

module.exports = mongoose.model('Order', orderSchema);
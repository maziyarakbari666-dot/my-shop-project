const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
<<<<<<< HEAD
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
=======
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'delivered'], default: 'pending' },
  address: { type: String, required: true },
  paidAt: { type: Date }
}, { timestamps: true });
>>>>>>> 52aec5e0824b0bbdf41a9c6b5055947101311081

module.exports = mongoose.model('Order', orderSchema);
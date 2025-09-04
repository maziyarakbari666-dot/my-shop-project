const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  price: { type: Number, required: true },
  inventory: { type: Number, required: true, default: 0 },
  isAvailable: { type: Boolean, default: true },
  unavailableTimes: [{
    start: String, // e.g. '10:00'
    end: String    // e.g. '12:00'
  }],
  category: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
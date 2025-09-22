const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
  type: { type: String, enum: ['deposit','withdraw','refund'], required: true },
  amount: { type: Number, required: true },
  ref: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  balance: { type: Number, default: 0 },
  transactions: [txSchema]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);







const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date },
  status: { type: String, enum: ['pending','paid','overdue'], default: 'pending' },
  lastReminderAt: { type: Date },
  reminderCount: { type: Number, default: 0 }
}, { _id: false });

const bnplPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  totalAmount: { type: Number, required: true },
  installments: [installmentSchema],
  status: { type: String, enum: ['active','completed','defaulted'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('BnplPlan', bnplPlanSchema);





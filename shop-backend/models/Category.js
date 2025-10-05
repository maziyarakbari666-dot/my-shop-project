const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
}, { timestamps: true });

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Category', categorySchema);
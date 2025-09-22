const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  seq: { type: Number, default: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('Counter', counterSchema);



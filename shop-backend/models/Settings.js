const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fee: { type: Number, required: true }
}, { _id: false });

const dayHoursSchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true }, // 0=Sun
  open: { type: String, required: true }, // "08:00"
  close: { type: String, required: true }, // "18:00"
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  deliveryZones: [zoneSchema],
  dailyHours: [dayHoursSchema],
  payments: {
    allowOnline: { type: Boolean, default: true },
    allowCOD: { type: Boolean, default: true },
    allowBNPL: { type: Boolean, default: true }
  },
  bnpl: {
    minCartTotal: { type: Number, default: 700000 },
    maxCartTotal: { type: Number, default: 2000000 },
    maxActivePlans: { type: Number, default: 30 }
  },
  hero: {
    title: { type: String, default: 'بیگ‌بیر - سوپرمارکت آنلاین' },
    subtitle: { type: String, default: 'تازه‌ترین محصولات، ارسال سریع، پرداخت اعتباری' },
    slides: { type: [String], default: [] }
  },
  about: {
    contentHtml: { type: String, default: '' }
  },
  contact: {
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    instagram: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  footer: {
    textHtml: { type: String, default: '' },
    links: { type: [{ label: String, href: String }], default: [] }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);




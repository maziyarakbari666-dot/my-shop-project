const cron = require('node-cron');
const BreadAvailability = require('../models/BreadAvailability');
const Product = require('../models/Product');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

async function ensureSlotsFor(date, product, plan) {
  const day = startOfDay(date);
  for (const slot of plan) {
    const from = new Date(day); from.setHours(slot.fromH, slot.fromM||0, 0, 0);
    const to = new Date(day); to.setHours(slot.toH, slot.toM||0, 0, 0);
    const existing = await BreadAvailability.findOne({ productId: product._id, fromTime: from, toTime: to });
    if (!existing) {
      await BreadAvailability.create({
        productId: product._id,
        date: day,
        fromTime: from,
        toTime: to,
        quantity: slot.quantity || 100,
        sold: 0,
        isAvailable: true
      });
    }
  }
}

async function refreshStates(now = new Date()) {
  // Auto-close past slots and those that reached capacity
  await BreadAvailability.updateMany({ toTime: { $lt: now }, isAvailable: true }, { $set: { isAvailable: false } });
  await BreadAvailability.updateMany({ $expr: { $gte: ['$sold', '$quantity'] } }, { $set: { isAvailable: false } });
}

async function runDailySetup() {
  const today = new Date();
  const products = await Product.find({ name: /نان/i, active: true });
  const plan = [
    { fromH: 7, toH: 9, toM: 30, quantity: 100 },
    { fromH: 12, toH: 14, quantity: 100 },
  ];
  for (const p of products) {
    await ensureSlotsFor(today, p, plan);
  }
  await refreshStates();
}

function startBreadAvailabilityScheduler() {
  // 07:00 and 12:00 every day
  cron.schedule('0 7 * * *', () => runDailySetup());
  cron.schedule('0 12 * * *', () => runDailySetup());
  // Also refresh states every 10 minutes
  cron.schedule('*/10 * * * *', () => refreshStates());
  // Run once on startup (non-test)
  if (process.env.NODE_ENV !== 'test') {
    runDailySetup().catch(()=>{});
  }
}

module.exports = { startBreadAvailabilityScheduler, runDailySetup, refreshStates };






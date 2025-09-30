const Order = require('../models/Order');
const Insight = require('../models/Insight');

function linearRegression(points) {
  const n = points.length;
  if (!n) return { m: 0, b: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = Number(points[i]) || 0;
    sumX += x; sumY += y; sumXY += x*y; sumXX += x*x;
  }
  const denom = n*sumXX - sumX*sumX || 1;
  const m = (n*sumXY - sumX*sumY) / denom;
  const b = (sumY - m*sumX) / n;
  return { m, b };
}

async function analyzeDaily() {
  const from = new Date(Date.now() - 30*24*60*60*1000);
  const orders = await Order.find({ createdAt: { $gte: from } }).sort({ createdAt: 1 }).lean();
  const byDay = {};
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0,10);
    if (!byDay[key]) byDay[key] = { date: key, count: 0, revenue: 0 };
    byDay[key].count += 1;
    byDay[key].revenue += Number(o.totalPrice||0);
  }
  const rows = Object.values(byDay);
  const model = linearRegression(rows.map(r => r.revenue));
  const nextIndex = rows.length + 1;
  const forecast = model.m * nextIndex + model.b;
  const avg7 = rows.slice(-7).reduce((a,r)=>a+r.revenue,0) / Math.max(1, Math.min(7, rows.length));
  const last = rows[rows.length - 1]?.revenue || 0;
  const drop = avg7 ? Math.round(((avg7 - last) / avg7) * 100) : 0;
  const anomaly = drop >= 30;

  await Insight.create({ kind: 'daily', periodStart: from, periodEnd: new Date(), payload: { rows } });
  await Insight.create({ kind: 'forecast', payload: { nextRevenue: Math.max(0, Math.round(forecast)) } });
  if (anomaly) await Insight.create({ kind: 'anomaly', payload: { message: `Revenue dropped ${drop}% vs 7-day avg`, dropPercent: drop } });
}

async function runInsights() {
  await analyzeDaily();
}

module.exports = { runInsights };



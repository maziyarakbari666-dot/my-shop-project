const { WebSocketServer } = require('ws');
const Order = require('../models/Order');
const Insight = require('../models/Insight');

function makeAuthGuard() {
  return function isAuthorized(req) {
    try {
      // simple header check: must pass admin gate before using WS in UI; here we keep it open but could add token-based check
      return true;
    } catch (_) { return false; }
  };
}

async function buildMetricsPayload() {
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end = now;
  const q = { createdAt: { $gte: start, $lte: end } };
  const [ordersToday, pendingToday, anomaly] = await Promise.all([
    Order.countDocuments(q),
    Order.countDocuments({ ...q, status: 'pending' }),
    Insight.findOne({ kind: 'anomaly' }).sort({ createdAt: -1 }).lean()
  ]);
  return { ordersToday, pendingToday, hasAnomaly: Boolean(anomaly?.payload?.message), ts: Date.now() };
}

function startWsMetrics(server) {
  const wss = new WebSocketServer({ server, path: '/ws/admin/metrics' });
  const isAuthorized = makeAuthGuard();

  wss.on('connection', async (ws, req) => {
    if (!isAuthorized(req)) { ws.close(1008, 'unauthorized'); return; }
    try {
      ws.send(JSON.stringify({ type: 'metrics', data: await buildMetricsPayload() }));
    } catch (_) {}
  });

  // MongoDB Change Streams (optional)
  try {
    const changeStream = Order.watch();
    changeStream.on('change', async () => {
      try {
        const payload = await buildMetricsPayload();
        const msg = JSON.stringify({ type: 'metrics', data: payload });
        wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
      } catch (_) {}
    });
  } catch (_) {
    // fallback: timer
    setInterval(async () => {
      try {
        const payload = await buildMetricsPayload();
        const msg = JSON.stringify({ type: 'metrics', data: payload });
        wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
      } catch (_) {}
    }, 15000);
  }
}

module.exports = { startWsMetrics };



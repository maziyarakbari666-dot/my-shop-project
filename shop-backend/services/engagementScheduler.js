const cron = require('node-cron');
const { getLoyalUsers, getInactiveUsers, getUsersForSurvey } = require('./customerSegmenter');
const { sendLoyalUserCoupon, sendInactiveUserReminder, sendSurveyRequest } = require('./smsMessenger');
const { createDiscountCodeForUser } = require('./discountManager');

// In-memory guard; for multi-instance deployments use DB-based log collection
const lastSentMap = new Map(); // key: `${type}:${userId}` -> Date

function canSend(key) {
  const last = lastSentMap.get(key);
  if (!last) return true;
  const diff = Date.now() - last.getTime();
  return diff > 48 * 60 * 60 * 1000; // 48h
}

function markSent(key) {
  lastSentMap.set(key, new Date());
}

async function runEngagementTasks() {
  const loyalUsers = await getLoyalUsers();
  for (const user of loyalUsers) {
    const key = `loyal:${user._id}`;
    if (!canSend(key)) continue;
    const code = await createDiscountCodeForUser(String(user._id), 15);
    await sendLoyalUserCoupon(user, code);
    markSent(key);
  }

  const inactiveUsers = await getInactiveUsers();
  for (const user of inactiveUsers) {
    const key = `inactive:${user._id}`;
    if (!canSend(key)) continue;
    const code = await createDiscountCodeForUser(String(user._id), 10);
    await sendInactiveUserReminder(user, code);
    markSent(key);
  }

  const surveyTargets = await getUsersForSurvey();
  for (const user of surveyTargets) {
    const key = `survey:${user._id}`;
    if (!canSend(key)) continue;
    await sendSurveyRequest(user);
    markSent(key);
  }
}

function startScheduler() {
  // every day at 10:00 server time
  cron.schedule('0 10 * * *', async () => {
    try { await runEngagementTasks(); } catch (e) { console.error('[EngagementScheduler]', e.message); }
  });
}

module.exports = { runEngagementTasks, startScheduler };



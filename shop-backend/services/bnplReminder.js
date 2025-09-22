const BnplPlan = require('../models/BnplPlan');
const Order = require('../models/Order');
const { sendSms } = require('./sms');

/**
 * Scan BNPL plans and send reminder SMS for overdue installments.
 * Policies:
 * - Only for active plans
 * - An installment is overdue if dueDate < now and not paid
 * - Throttle: send at most one reminder per 24h per installment
 * - Respect REMINDER_MAX_PER_INSTALLMENT if set
 */
async function runBnplRemindersOnce(now = new Date()) {
  const throttleHours = Number(process.env.BNPL_REMINDER_THROTTLE_HOURS || 24);
  const maxPerInstallment = Number(process.env.BNPL_REMINDER_MAX || 10);

  const plans = await BnplPlan.find({ status: 'active' }).lean();
  for (const plan of plans) {
    const order = await Order.findById(plan.order).lean();
    const phone = order?.contactPhone;
    if (!phone) continue;

    for (let idx = 0; idx < (plan.installments || []).length; idx++) {
      const inst = plan.installments[idx];
      if (inst.status === 'paid') continue;
      const isOverdue = inst.dueDate && new Date(inst.dueDate).getTime() < now.getTime();
      if (!isOverdue) continue;

      if (typeof inst.reminderCount === 'number' && inst.reminderCount >= maxPerInstallment) continue;
      const lastAt = inst.lastReminderAt ? new Date(inst.lastReminderAt) : null;
      if (lastAt && (now.getTime() - lastAt.getTime()) < throttleHours * 60 * 60 * 1000) continue;

      const dueFa = new Date(inst.dueDate).toLocaleString('fa-IR');
      const code = order?.orderNumber || order?._id;
      const msg = `یادآوری قسط سفارش ${code}: مبلغ ${inst.amount} تومان، سررسید: ${dueFa}. لطفاً نسبت به پرداخت اقدام کنید.`;
      try {
        await sendSms(phone, msg);
      } catch (_) {}

      // Persist reminder meta using positional $set path
      try {
        const setPathCount = `installments.${idx}.reminderCount`;
        const setPathLast = `installments.${idx}.lastReminderAt`;
        await BnplPlan.updateOne({ _id: plan._id }, { $set: { [setPathLast]: now }, $inc: { [setPathCount]: 1 } });
      } catch (_) {}
    }
  }
}

function startScheduler() {
  const intervalMinutes = Number(process.env.BNPL_REMINDER_INTERVAL_MIN || 60);
  const intervalMs = Math.max(5, intervalMinutes) * 60 * 1000;
  setInterval(() => {
    runBnplRemindersOnce().catch(err => console.error('[BNPL][REMINDER] error:', err.message));
  }, intervalMs);
  console.log('[BNPL][REMINDER] Scheduler started. Interval (min):', Math.max(5, intervalMinutes));
}

module.exports = { runBnplRemindersOnce, startScheduler };



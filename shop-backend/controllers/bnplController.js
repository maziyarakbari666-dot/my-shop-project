const BnplPlan = require('../models/BnplPlan');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

// Eligibility: simple rule -> at least 2 successful orders (paid or delivered) - برای تست
exports.checkEligibility = async (req, res, next) => {
  try {
    const [count, activeExists, settings] = await Promise.all([
      Order.countDocuments({ user: req.user.id, status: { $in: ['paid','delivered'] } }),
      BnplPlan.exists({ user: req.user.id, status: 'active' }),
      Settings.findOne().sort({ createdAt: -1 })
    ]);
    // global cap check
    let capReached = false;
    try {
      const maxActive = Math.max(0, Number(settings?.bnpl?.maxActivePlans || 30));
      if (maxActive > 0) {
        const activeCount = await BnplPlan.countDocuments({ status: 'active' });
        capReached = activeCount >= maxActive;
      }
    } catch(_) {}
    const eligible = (count >= 2) && !activeExists && !capReached; // حتماً بدون طرح فعال و عدم پر بودن ظرفیت
    res.success({ eligible, ordersCount: count, hasActivePlan: Boolean(activeExists), capReached });
  } catch (err) { next(err); }
};

// Create BNPL plan from an order (called after order create when paymentMethod === 'bnpl')
exports.createPlan = async (req, res, next) => {
  try {
    const { orderId, parts = 4 } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.fail('سفارش پیدا نشد.', 404);
    if (String(order.user) !== String(req.user.id)) return res.fail('دسترسی غیرمجاز.', 403);
    if (order.paymentMethod !== 'bnpl') return res.fail('روش پرداخت این سفارش BNPL نیست.', 400);
    // Prevent creating a new plan if an active plan exists
    const activeExists = await BnplPlan.exists({ user: req.user.id, status: 'active' });
    if (activeExists) return res.fail('تا تسویه طرح اعتباری فعال فعلی، امکان ایجاد طرح جدید وجود ندارد.', 400);
    // Capacity check again for safety
    try {
      const settings = await Settings.findOne().sort({ createdAt: -1 });
      const maxActive = Math.max(0, Number(settings?.bnpl?.maxActivePlans || 30));
      if (maxActive > 0) {
        const activeCount = await BnplPlan.countDocuments({ status: 'active' });
        if (activeCount >= maxActive) return res.fail('با توجه به محدودیت منابع، ایجاد طرح اعتباری جدید ممکن نیست.', 400);
      }
    } catch(_) {}

    const total = Number(order.totalPrice) || 0;
    const base = Math.floor(total / parts);
    const remainder = total - base * parts;
    const now = new Date();
    const installments = [];
    for (let i = 0; i < parts; i++) {
      const amt = base + (i === 0 ? remainder : 0);
      const due = new Date(now);
      due.setMonth(due.getMonth() + i); // monthly
      installments.push({ amount: amt, dueDate: due });
    }
    const plan = await BnplPlan.create({ user: order.user, order: order._id, totalAmount: total, installments });
    res.success({ plan });
  } catch (err) { next(err); }
};

// List plans for current user
exports.listMyPlans = async (req, res, next) => {
  try {
    const plans = await BnplPlan.find({ user: req.user.id }).populate('order').sort({ createdAt: -1 });
    res.success({ plans });
  } catch (err) { next(err); }
};

// Admin list all (supports q + pagination)
exports.listAll = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(200, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    const filter = {};
    if (q) {
      const regex = new RegExp(String(q), 'i');
      filter.$or = [{ 'customer': regex }];
    }
    const [items, total] = await Promise.all([
      BnplPlan.find(filter).populate('order user').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      BnplPlan.countDocuments(filter)
    ]);
    res.success({ plans: items, total, page, pageSize });
  } catch (err) { next(err); }
};

// Mark installment as paid
exports.payInstallment = async (req, res, next) => {
  try {
    const { id } = req.params; // plan id
    const { index } = req.body; // installment index
    const plan = await BnplPlan.findById(id);
    if (!plan) return res.fail('برنامه یافت نشد.', 404);
    const inst = plan.installments[index];
    if (!inst) return res.fail('قسط یافت نشد.', 404);
    inst.paidAt = new Date();
    inst.status = 'paid';
    // if all paid -> completed
    if (plan.installments.every(i => i.status === 'paid')) {
      plan.status = 'completed';
      // سفارش اصلی را نیز به‌روزرسانی کن
      const Order = require('../models/Order');
      const order = await Order.findById(plan.order);
      if (order) {
        order.status = 'paid';
        order.paidAt = new Date();
        await order.save();
      }
    }
    await plan.save();
    res.success({ plan });
  } catch (err) { next(err); }
};





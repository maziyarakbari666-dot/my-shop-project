const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, percent, amount, maxUse, expiresAt, minAmount, categories, active } = req.body;
    const coupon = await Coupon.create({ code, percent, amount, maxUse, expiresAt, minAmount, categories, active });
    res.success({ coupon });
  } catch (err) {
    next(err);
  }
};

exports.listCoupons = async (req, res, next) => {
  try {
    const { q, active } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(200, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    const filter = {};
    if (q) filter.code = new RegExp(String(q), 'i');
    if (typeof active !== 'undefined') filter.active = String(active) === 'true';
    const [items, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Coupon.countDocuments(filter)
    ]);
    res.success({ coupons: items, total, page, pageSize });
  } catch (err) {
    next(err);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal, categories } = req.body;
    const coupon = await Coupon.findOne({ code: String(code || '').toUpperCase().trim(), active: true });
    if (!coupon) return res.fail('کد تخفیف معتبر نیست.', 404);
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.fail('کد تخفیف منقضی شده است.', 400);
    if (coupon.maxUse && coupon.usedCount >= coupon.maxUse) return res.fail('سقف استفاده از این کد پر شده است.', 400);
    if (coupon.minAmount && Number(cartTotal) < coupon.minAmount) return res.fail('مجموع خرید کمتر از حداقل مبلغ است.', 400);
    if (coupon.categories && coupon.categories.length > 0) {
      const hasAllowed = (Array.isArray(categories) ? categories : []).some(cat => coupon.categories.includes(cat));
      if (!hasAllowed) return res.fail('کد برای دسته‌های انتخابی فعال نیست.', 400);
    }
    // compute discount
    let discount = 0;
    if (coupon.percent) discount = Math.floor((Number(cartTotal) * coupon.percent) / 100);
    if (coupon.amount) discount = Math.max(discount, coupon.amount);
    // If user required for coupons, uncomment the next lines:
    // if (!req.user) return res.fail('برای استفاده از کد تخفیف وارد شوید.', 401);
    res.success({ coupon, discount });
  } catch (err) {
    next(err);
  }
};



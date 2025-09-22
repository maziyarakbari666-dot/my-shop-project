const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// One-time seeding: promote a user to admin using a setup token
exports.seedAdmin = async (req, res, next) => {
  try {
    const { token, phone, email } = req.body;
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    const isProd = process.env.NODE_ENV === 'production';
    if (setupToken) {
      if (token !== setupToken) return res.fail('دسترسی غیرمجاز.', 403);
    } else {
      // در صورت عدم تنظیم توکن، فقط در محیط غیرپروداکشن و از لوکال اجازه بده
      const ip = (req.ip || '') + '|' + (req.headers['x-forwarded-for'] || '');
      const isLocal = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost');
      if (isProd || !isLocal) return res.fail('دسترسی غیرمجاز.', 403);
    }
    const identifierEmail = email || (phone ? `${phone}@otp.local` : null);
    if (!identifierEmail) return res.fail('phone یا email را ارسال کنید.', 400);
    let user = await User.findOne({ email: identifierEmail });
    if (!user) {
      user = await User.create({ name: phone || 'admin', email: identifierEmail, password: 'seeded' });
    }
    user.role = 'admin';
    await user.save();
    res.success({ user });
  } catch (err) { next(err); }
};

// Promote by admin: requires isAdmin middleware
exports.promote = async (req, res, next) => {
  try {
    const { userId, email } = req.body;
    let user = null;
    if (userId) user = await User.findById(userId);
    else if (email) user = await User.findOne({ email });
    if (!user) return res.fail('کاربر یافت نشد.', 404);
    user.role = 'admin';
    await user.save();
    res.success({ user });
  } catch (err) { next(err); }
};

// List admins (secured via ADMIN_SETUP_TOKEN for quick inspection during setup)
exports.listAdmins = async (req, res, next) => {
  try {
    const { token } = req.body || {};
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    const isProd = process.env.NODE_ENV === 'production';
    if (setupToken) {
      if (token !== setupToken) return res.fail('دسترسی غیرمجاز.', 403);
    } else {
      // در صورت عدم تنظیم توکن، فقط در محیط غیرپروداکشن و از لوکال اجازه بده
      const ip = (req.ip || '') + '|' + (req.headers['x-forwarded-for'] || '');
      const isLocal = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost');
      if (isProd || !isLocal) return res.fail('دسترسی غیرمجاز.', 403);
    }
    const users = await User.find({ role: 'admin' }).select('name email role').lean();
    const admins = (users || []).map(u => {
      let phone = null;
      if (u?.email && u.email.endsWith('@otp.local')) phone = u.email.split('@')[0];
      else if (u?.name && /^09\d{9}$/.test(u.name)) phone = u.name;
      return { name: u.name, email: u.email, phone };
    });
    return res.success({ admins });
  } catch (err) { next(err); }
};

// Analytics
exports.analytics = async (req, res, next) => {
  try {
    const { from, to, status, payment } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (status) filter.status = status;
    if (payment) filter.paymentMethod = payment;
    const orders = await Order.find(filter);
    const totalRevenue = orders.reduce((a,o)=>a+Number(o.totalPrice||0),0);
    const count = orders.length;
    const avgOrder = count ? Math.round(totalRevenue / count) : 0;
    const bnplCount = orders.filter(o=>o.paymentMethod==='bnpl').length;
    const bnplRatio = count ? Math.round((bnplCount / count) * 100) : 0;
    const byStatus = orders.reduce((acc,o)=>{ acc[o.status]=(acc[o.status]||0)+1; return acc; },{});
    res.success({ totalRevenue, count, avgOrder, bnplRatio, byStatus });
  } catch (err) { next(err); }
};

exports.analyticsDaily = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const orders = await Order.find(filter).sort({ createdAt: 1 });
    const byDay = {};
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = d.toISOString().slice(0,10);
      if (!byDay[key]) byDay[key] = { date: key, count: 0, revenue: 0, bnpl: 0 };
      byDay[key].count += 1;
      byDay[key].revenue += Number(o.totalPrice||0);
      if (o.paymentMethod === 'bnpl') byDay[key].bnpl += 1;
    }
    const rows = Object.values(byDay).sort((a,b)=>a.date.localeCompare(b.date));
    if (req.query.format === 'csv') {
      const csvRows = ['date,count,revenue,bnpl'];
      rows.forEach(r => csvRows.push([r.date, r.count, r.revenue, r.bnpl].join(',')));
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      return res.send(csvRows.join('\n'));
    }
    res.success({ rows });
  } catch (err) { next(err); }
};

// Keep a single implementation of analyticsByCategory

exports.analyticsByCategory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const orders = await Order.find(filter).populate('products.product');
    const byCat = {};
    for (const o of orders) {
      for (const line of o.products || []) {
        const catName = (line.product && line.product.category && line.product.category.name) || 'نامشخص';
        if (!byCat[catName]) byCat[catName] = { category: catName, revenue: 0, count: 0 };
        byCat[catName].count += Number(line.quantity||0);
        // approximate revenue share by line price if present (fallback: average)
        const price = Number(line.product?.price || 0);
        byCat[catName].revenue += price * Number(line.quantity||0);
      }
    }
    const rows = Object.values(byCat).sort((a,b)=>b.revenue - a.revenue);
    if (req.query.format === 'csv') {
      const csvRows = ['category,count,revenue'];
      rows.forEach(r => csvRows.push([r.category, r.count, r.revenue].join(',')));
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      return res.send(csvRows.join('\n'));
    }
    res.success({ rows });
  } catch (err) { next(err); }
};







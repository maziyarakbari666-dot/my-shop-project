const Order = require('../models/Order');
const Settings = require('../models/Settings');
const notifications = require('./notificationController');

exports.createOrder = async (req, res, next) => {
  try {
    // Attach user from token (guest route, so middleware may not run)
    try {
      if (!req.user || !req.user.id) {
        const jwt = require('jsonwebtoken');
        const authHeader = req.headers['authorization'];
        let token = null;
        if (req.cookies?.auth_token) token = req.cookies.auth_token;
        if (!token && authHeader) token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (token && process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded?.id) req.user = { id: decoded.id, role: decoded.role };
        }
      }
    } catch (_) {}
    const { products, address, region, plaque, unit, contactPhone } = req.body;
    let { contactName, deliveryDate, deliverySlot, deliveryFee, discount, paymentMethod } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.fail('لیست محصولات نامعتبر است.', 400);
    }
    // Fallback name from user profile if missing and user is authenticated
    if ((!contactName || String(contactName).trim().length < 2) && req.user && req.user.id) {
      try {
        const User = require('../models/User');
        const u = await User.findById(req.user.id);
        if (u && u.name && String(u.name).trim().length >= 2) {
          contactName = u.name;
        }
      } catch (_) {}
    }
    if (!contactName || String(contactName).trim().length < 2) {
      return res.fail('نام و نام خانوادگی را وارد کنید.', 422);
    }
    let totalPrice = 0;
    let hasBread = false;
    products.forEach(p => {
      const price = Number(p.price) || 0;
      const quantity = Number(p.quantity) || 0;
      totalPrice += price * quantity;
      if (String(p.category||'').includes('نان')) hasBread = true;
    });
    const itemsSubtotal = totalPrice;
    // final price includes fee and discount
    // Free shipping threshold
    const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD || 500000);
    const fee = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : (Number(deliveryFee) || 0);
    totalPrice = totalPrice + fee - (Number(discount) || 0);
    // delivery rules: if has bread category => min +2h from now; else +1.5h
    const now = new Date();
    const minMs = hasBread ? 2 * 60 * 60 * 1000 : 90 * 60 * 1000;
    let requested = deliveryDate ? new Date(deliveryDate) : undefined;
    if (requested && deliverySlot) {
      // try to coerce slot start hour
      const match = /^(\d{1,2})\s*تا\s*(\d{1,2})$/.exec(deliverySlot);
      if (match) {
        requested.setHours(Number(match[1]), 0, 0, 0);
      }
    }
    if (requested && requested.getTime() - now.getTime() < minMs) {
      return res.fail('بازه زمانی انتخابی مجاز نیست. لطفاً بازه دیرتری انتخاب کنید.', 400);
    }

    // If bread is in cart, enforce BreadAvailability slot capacity
    if (hasBread) {
      try {
        const BreadAvailability = require('../models/BreadAvailability');
        const Product = require('../models/Product');
        const breadProducts = await Product.find({ name: /نان/i });
        const breadIds = breadProducts.map(p => String(p._id));
        // find matching slot for requested date and deliverySlot string like "7 تا 9"
        if (requested && deliverySlot) {
          const slotMatch = /^(\d{1,2})\s*تا\s*(\d{1,2})$/.exec(String(deliverySlot));
          if (slotMatch) {
            const startHour = Number(slotMatch[1]);
            const endHour = Number(slotMatch[2]);
            const day = new Date(requested); day.setHours(0,0,0,0);
            const from = new Date(day); from.setHours(startHour, 0, 0, 0);
            const to = new Date(day); to.setHours(endHour, 0, 0, 0);
            const slot = await BreadAvailability.findOne({ productId: { $in: breadIds }, fromTime: from, toTime: to });
            if (!slot || !slot.isAvailable) {
              return res.fail('این بازه برای نان در دسترس نیست.', 400);
            }
            // compute quantity of bread in cart
            const breadQty = (products||[]).filter(p => String(p.category||'').includes('نان')).reduce((s, p) => s + (Number(p.quantity)||0), 0);
            if ((slot.sold + breadQty) > slot.quantity) {
              return res.fail('ظرفیت نان در این بازه تکمیل شده است.', 400);
            }
            // reserve: increment sold atomically
            const updated = await BreadAvailability.findOneAndUpdate(
              { _id: slot._id, sold: { $lte: slot.quantity - breadQty } },
              { $inc: { sold: breadQty }, $set: { isAvailable: (slot.sold + breadQty) < slot.quantity } },
              { new: true }
            );
            if (!updated) {
              return res.fail('ظرفیت نان در این بازه کافی نیست.', 400);
            }
          }
        }
      } catch (_) {}
    }

    // enforce payments toggles from settings
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    if (settings && settings.payments) {
      if (paymentMethod === 'online' && settings.payments.allowOnline === false) {
        return res.fail('پرداخت الکترونیکی غیرفعال است.', 400);
      }
      if (paymentMethod === 'cod' && settings.payments.allowCOD === false) {
        return res.fail('پرداخت در محل غیرفعال است.', 400);
      }
      if (paymentMethod === 'bnpl' && settings.payments.allowBNPL === false) {
        return res.fail('پرداخت اعتباری (BNPL) غیرفعال است.', 400);
      }
    }

    // enforce bnpl only if logged in
    if (paymentMethod === 'bnpl' && !(req.user && req.user.id)) {
      return res.fail('برای پرداخت اعتباری وارد شوید.', 401);
    }
    // BNPL extra rules: min/max cart total and max active plans
    if (paymentMethod === 'bnpl') {
      const bnplCfg = settings?.bnpl || {};
      const minCart = Number(bnplCfg.minCartTotal || 700000);
      const maxCart = Number(bnplCfg.maxCartTotal || 2000000);
      if (itemsSubtotal < minCart) {
        return res.fail(`حداقل مبلغ سبد برای خرید اعتباری ${minCart.toLocaleString()} تومان است.`, 400);
      }
      if (itemsSubtotal > maxCart) {
        return res.fail(`حداکثر مبلغ سبد برای خرید اعتباری ${maxCart.toLocaleString()} تومان است.`, 400);
      }
      // global cap: disable BNPL when active plans reach cap
      try {
        const BnplPlan = require('../models/BnplPlan');
        const maxActive = Math.max(0, Number(bnplCfg.maxActivePlans || 30));
        if (maxActive > 0) {
          const activeCount = await BnplPlan.countDocuments({ status: 'active' });
          if (activeCount >= maxActive) {
            return res.fail('با توجه به محدودیت منابع، خرید اعتباری موقتاً غیرفعال است.', 400);
          }
        }
      } catch(_) {}
    }
    // block BNPL if user has an active plan
    if (paymentMethod === 'bnpl' && req.user && req.user.id) {
      try {
        const BnplPlan = require('../models/BnplPlan');
        const activeExists = await BnplPlan.exists({ user: req.user.id, status: 'active' });
        if (activeExists) return res.fail('شما یک طرح اعتباری فعال دارید. ابتدا آن را تسویه کنید.', 400);
      } catch (_) {}
    }

    const orderPayload = {
      products: products.map(p => ({ product: p.product, quantity: p.quantity, price: p.price })),
      totalPrice,
      address,
      region,
      plaque,
      unit,
      contactPhone,
      contactName: String(contactName).trim(),
      deliveryDate: requested,
      deliverySlot,
      deliveryFee: fee,
      discount: Number(discount) || 0,
      paymentMethod: paymentMethod || 'online',
    };
    if (req.user && req.user.id) orderPayload.user = req.user.id;
    const order = await Order.create(orderPayload);
    
    // برای تست BNPL، تمام سفارش‌ها را موفق در نظر بگیریم
    if (paymentMethod === 'cod') {
      order.status = 'delivered';
      await order.save();
    } else if (paymentMethod === 'online') {
      // سفارش‌های آنلاین را نیز مستقیماً paid کنیم (برای تست)
      order.status = 'paid';
      order.paidAt = new Date();
      await order.save();
    } else if (paymentMethod === 'bnpl') {
      // سفارش‌های BNPL در حالت pending باقی می‌مانند تا plan ایجاد شود
      // اما اگر کاربر واجد شرایط نباشد، آن را delivered کنیم
      const BnplPlan = require('../models/BnplPlan');
      const activeExists = await BnplPlan.exists({ user: req.user?.id, status: 'active' });
      if (activeExists || !req.user?.id) {
        // اگر طرح فعال دارد یا guest است، BNPL نمی‌تواند استفاده کند
        order.paymentMethod = 'cod'; // تبدیل به COD
        order.status = 'delivered';
        await order.save();
      }
    }
    // If user is logged in and provided a contactName, try to sync it to User.name
    try {
      if (order.user) {
        const User = require('../models/User');
        const u = await User.findById(order.user);
        if (u) {
          // update basic info
          if (contactName && String(contactName).trim().length >= 2) {
            const trimmed = String(contactName).trim();
            const onlyDigits = trimmed.replace(/\s|-/g, '');
            const looksLikePhone = /^(?:\+?98|0)?9\d{9}$/.test(onlyDigits);
            if (!looksLikePhone && u.name !== trimmed) {
              u.name = trimmed;
            }
          }
          if (order.contactPhone && !u.phoneNumber) {
            u.phoneNumber = order.contactPhone;
            if (!u.phone) u.phone = order.contactPhone;
          }
          // engagement metrics
          u.totalOrders = Math.max(0, Number(u.totalOrders||0)) + 1;
          u.lastOrderDate = new Date();
          await u.save();
        }
      }
    } catch (_) {}
    // notifications (stubbed)
    try {
      notifications.notifyAdminNewOrder(order);
      if (contactPhone) notifications.notifyCustomerOrderSubmitted(contactPhone, order);
    } catch (_) {}
    // increment coupon usage if any (simple: query param not persisted in schema here)
    if (req.body.coupon) {
      try {
        const Coupon = require('../models/Coupon');
        const c = await Coupon.findOne({ code: String(req.body.coupon).toUpperCase() });
        if (c) { c.usedCount = (c.usedCount||0) + 1; await c.save(); }
      } catch (_) {}
    }
    res.success({ order });
  } catch (err) {
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 10));
    const skip = (page - 1) * pageSize;
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('products.product')
        .populate('user', 'name'),
      Order.countDocuments({ user: req.user.id })
    ]);
    res.success({ orders, total, page, pageSize });
  } catch (err) {
    next(err);
  }
};

// admin: list all (supports from,to,status,payment,q + pagination page/pageSize)
exports.getAllOrders = async (req, res, next) => {
  try {
    // Filters: from/to expected to be Jalali date strings (YYYY-MM-DD in fa-IR) or ISO
    // Note: Filtering by deliveryDate (not createdAt) to show orders by delivery date
    let { from, to, status, payment, q } = req.query;
    const filter = {};
    if (from || to) {
      // Try parse jalali using simple heuristic; fall back to Date
      const parseDate = (s) => {
        if (!s) return null;
        // accept ISO
        const d1 = new Date(s);
        if (!isNaN(d1)) return d1;
        // accept jalali like 1402-06-12 -> convert using Intl (fallback naive):
        try {
          // Note: for full jalali support, front-end will send ISO after converting.
          return new Date(s);
        } catch {
          return null;
        }
      };
      const fromDate = parseDate(from);
      const toDate = parseDate(to);
      filter.deliveryDate = {};
      if (fromDate) filter.deliveryDate.$gte = fromDate;
      if (toDate) {
        // برای روز "تا"، تا آخر روز را در نظر بگیریم
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.deliveryDate.$lte = endOfDay;
      }
      if (!Object.keys(filter.deliveryDate).length) delete filter.deliveryDate;
    }

    if (status) filter.status = status;
    if (payment) filter.paymentMethod = payment;
    if (q) {
      const regex = new RegExp(String(q), 'i');
      filter.$or = [
        { contactName: regex },
        { contactPhone: regex },
        { orderNumber: regex },
        { _id: String(q).match(/^[a-f\d]{24}$/i) ? String(q) : undefined }
      ].filter(Boolean);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(200, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('products.product')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Order.countDocuments(filter)
    ]);
    const orders = items;
    if (req.query.format === 'csv') {
      const statusFa = { pending: 'در انتظار پرداخت', paid: 'پرداخت شده', shipped: 'ارسال شده', delivered: 'تکمیل شده', cancelled: 'لغو شده' };
      const paymentFa = { online: 'الکترونیکی', cod: 'در محل', bnpl: 'اعتباری' };
      const rows = [
        ['orderNumber','customer','phone','status','payment','total','address','date','slot'].join(',')
      ];
      for (const o of orders) {
        rows.push([
          o.orderNumber || o._id,
          (o.contactName || (o.user && o.user.name) || ''),
          (o.contactPhone||''),
          statusFa[o.status] || o.status || '',
          paymentFa[o.paymentMethod] || o.paymentMethod || '',
          o.totalPrice,
          (o.address||'').replace(/,/g,' '),
          o.deliveryDate ? new Date(o.deliveryDate).toISOString() : '',
          o.deliverySlot || ''
        ].join(','));
      }
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      return res.send(rows.join('\n'));
    }
    res.success({ orders, total, page, pageSize });
  } catch (err) { next(err); }
};

// admin: cancel with reason and (optional) refund amount
const Wallet = require('../models/Wallet');
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, refund } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.fail('سفارش پیدا نشد.', 404);
    order.status = 'cancelled';
    order.cancelReason = reason || 'لغو توسط ادمین';
    await order.save();
    if (refund && order.user) {
      let wallet = await Wallet.findOne({ user: order.user });
      if (!wallet) wallet = await Wallet.create({ user: order.user, balance: 0, transactions: [] });
      const amount = Number(refund) || 0;
      if (amount > 0) {
        wallet.balance += amount;
        wallet.transactions.push({ type: 'refund', amount, ref: `order:${order._id}` });
        await wallet.save();
      }
    }
    // send SMS about cancellation reason
    try {
      const { sendSms } = require('../services/sms');
      if (order.contactPhone) {
        const code = order.orderNumber || order._id;
        let text = `سفارش ${code} لغو شد.`;
        if (String(reason||'').includes('عدم موجودی')) text = 'دلیل لغو سفارش شما: عدم موجودی محصول مورد نظر. مبلغ پرداختی به کیف پول شما بازگشت داده شد.';
        else if (String(reason||'').includes('مغایرت آدرس')) text = 'دلیل لغو سفارش شما: مغایرت آدرس و منطقه انتخاب‌شده مشتری برای ارسال. مبلغ پرداختی به کیف پول شما بازگشت داده شد.';
        else if (String(reason||'').includes('آدرس نامعتبر')) text = 'دلیل لغو سفارش شما: ثبت آدرس نامعتبر و نامفهوم. مبلغ پرداختی به کیف پول شما بازگشت داده شد.';
        else if (reason) text = `دلیل لغو سفارش شما: ${reason}`;
        await sendSms(order.contactPhone, text);
      }
    } catch (_) {}
    res.success({ order });
  } catch (err) { next(err); }
};
exports.payOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.fail('سفارش پیدا نشد.', 404);
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
    res.success({ order });
  } catch (err) {
    next(err);
  }
};

// After createOrder success, frontend may call BNPL create-plan separately. Alternatively, we can auto-create here.

// admin: send order details to a courier via WhatsApp
exports.sendToCourier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body || {};
    if (!courierId) return res.fail('شناسه پیک الزامی است.', 400);
    const Order = require('../models/Order');
    const Courier = require('../models/Courier');
    const CourierMessage = require('../models/CourierMessage');
    const { sendOrderToCourier } = require('../services/whatsapp');
    const order = await Order.findById(id);
    if (!order) return res.fail('سفارش پیدا نشد.', 404);
    const courier = await Courier.findById(courierId);
    if (!courier) return res.fail('پیک یافت نشد.', 404);

    const parts = [];
    parts.push(`سفارش ${order.orderNumber || order._id}`);
    if (order.address) parts.push(`آدرس: ${order.address}`);
    if (order.region) parts.push(`منطقه: ${order.region}`);
    if (order.plaque) parts.push(`پلاک: ${order.plaque}`);
    if (order.unit) parts.push(`واحد: ${order.unit}`);
    if (order.contactName) parts.push(`مشتری: ${order.contactName}`);
    if (order.contactPhone) parts.push(`تلفن مشتری: ${order.contactPhone}`);
    if (order.deliveryDate || order.deliverySlot) {
      const dateFa = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('fa-IR') : '';
      const slot = order.deliverySlot || '';
      parts.push(`زمان تحویل: ${[dateFa, slot].filter(Boolean).join(' - ')}`);
    }
    const body = parts.join('\n');

    const result = await sendOrderToCourier({ toPhone: courier.phone, body, expiresInSeconds: 24*60*60 });

    if (result.mode === 'api') {
      const expiresAt = new Date(Date.now() + 24*60*60*1000);
      await CourierMessage.create({ courier: courier._id, order: order._id, whatsappMessageId: result.messageId, toPhone: courier.phone, expiresAt, status: 'sent' });
      return res.success({ ok: true, sent: true });
    } else {
      // fallback: return link for manual send
      await CourierMessage.create({ courier: courier._id, order: order._id, toPhone: courier.phone, expiresAt: new Date(Date.now() + 24*60*60*1000), status: 'fallback', error: result.error || 'fallback_link' });
      return res.success({ ok: true, sent: false, waLink: result.waLink });
    }
  } catch (err) { next(err); }
};
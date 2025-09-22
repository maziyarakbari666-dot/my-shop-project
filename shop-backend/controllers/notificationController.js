exports.notifyAdminNewOrder = async (order) => {
  try {
    const { sendMail, buildAdminOrderHtml } = require('../services/email');
    const Order = require('../models/Order');
    const User = require('../models/User');

    // Reload order with populated products to include product names
    const fullOrder = await Order.findById(order._id).populate('products.product').lean();
    const populated = fullOrder || order;

    // Determine recipients: prefer env, fallback to admin users' emails
    let recipients = [];
    const envList = (process.env.ADMIN_EMAILS || process.env.MAIL_ADMIN_TO || '').split(',').map(s => s.trim()).filter(Boolean);
    if (envList.length > 0) {
      recipients = envList;
    } else {
      try {
        const admins = await User.find({ role: 'admin' }).select('email').lean();
        recipients = (admins || []).map(a => a.email).filter(e => e && /@/.test(e) && !e.endsWith('@otp.local'));
      } catch (_) {}
    }

    if (!recipients || recipients.length === 0) {
      console.warn('[NOTIFY][ADMIN] No admin emails configured. Set ADMIN_EMAILS or create admin users with valid emails.');
      return;
    }

    const subject = `سفارش جدید ${populated.orderNumber || populated._id}`;

    const html = buildAdminOrderHtml(populated, populated.products);
    const text = `سفارش جدید ثبت شد\nکد سفارش: ${populated.orderNumber || populated._id}\n` +
      `نام مشتری: ${populated.contactName || '-'}\n` +
      `تلفن: ${populated.contactPhone || '-'}\n` +
      `نشانی: ${populated.address || '-'} ${populated.region ? `(منطقه: ${populated.region})` : ''}\n` +
      `مبلغ کل: ${populated.totalPrice}`;

    await sendMail({ to: recipients.join(','), subject, text, html });
    console.log('[NOTIFY][ADMIN] Email sent for order', populated._id, 'to', recipients);
  } catch (e) {
    console.error('[NOTIFY][ADMIN] Failed to send email for new order:', e && e.message ? e.message : e);
  }
};

exports.notifyCustomerOrderSubmitted = (phone, order) => {
  try {
    const { sendSms } = require('../services/sms');
    const code = order.orderNumber || order._id;
    const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleString('fa-IR') : null;
    const slot = order.deliverySlot ? ` (${order.deliverySlot})` : '';
    const when = deliveryDate ? `تاریخ تحویل: ${deliveryDate}${slot}` : '';
    const total = typeof order.totalPrice === 'number' ? order.totalPrice : null;
    const totalTxt = total != null ? `، مبلغ کل: ${total} تومان` : '';
    const msg = `سفارش شما با موفقیت ثبت شد. کد سفارش: ${code}${totalTxt}${when ? `، ${when}` : ''}`;
    sendSms(phone, msg);
  } catch (_) {}
};



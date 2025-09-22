const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  if (!host || !user || !pass) {
    console.warn('[email] SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
  return cachedTransporter;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) return { skipped: true, reason: 'not_configured' };
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, text, html });
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('fa-IR').format(Number(amount || 0)) + ' تومان';
  } catch (_) {
    return `${amount} تومان`;
  }
}

function buildAdminOrderHtml(order, productsDetailed) {
  const rows = (productsDetailed || []).map(p => {
    const name = p?.product?.name || p?.name || 'کالا';
    const price = p?.price ?? p?.product?.price ?? 0;
    const quantity = p?.quantity || 1;
    const total = Number(price) * Number(quantity);
    return `<tr><td>${name}</td><td>${quantity}</td><td>${formatCurrency(price)}</td><td>${formatCurrency(total)}</td></tr>`;
  }).join('');

  const delivery = [
    order?.deliveryDate ? new Date(order.deliveryDate).toLocaleString('fa-IR') : null,
    order?.deliverySlot || null
  ].filter(Boolean).join(' - ');

  return `
  <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right">
    <h3>سفارش جدید ثبت شد</h3>
    <p>کد سفارش: <b>${order.orderNumber || order._id}</b></p>
    <p>نام مشتری: ${order.contactName || '-'}</p>
    <p>تلفن: ${order.contactPhone || '-'}</p>
    <p>نشانی: ${order.address || '-'} ${order.region ? `(منطقه: ${order.region})` : ''} ${order.plaque ? `پلاک ${order.plaque}` : ''} ${order.unit ? `واحد ${order.unit}` : ''}</p>
    <p>زمان دریافت: ${delivery || '-'}</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;margin-top:12px">
      <thead>
        <tr>
          <th>محصول</th>
          <th>تعداد</th>
          <th>قیمت واحد</th>
          <th>قیمت کل</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p>هزینه ارسال: ${formatCurrency(order.deliveryFee || 0)}</p>
    <p>تخفیف: ${formatCurrency(order.discount || 0)}</p>
    <p><b>جمع کل: ${formatCurrency(order.totalPrice || 0)}</b></p>
    <p>روش پرداخت: ${order.paymentMethod || '-'}</p>
    <p>وضعیت: ${order.status || '-'}</p>
  </div>`;
}

module.exports = { sendMail, buildAdminOrderHtml };



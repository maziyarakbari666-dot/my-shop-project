const fetch = (typeof global.fetch === 'function') ? global.fetch : require('node-fetch');
const Order = require('../models/Order');

function resolveBaseUrl(req) {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
  return `${proto}://${host}`;
}

function toGatewayAmount(amountToman) {
  const sendInRial = String(process.env.ZARINPAL_SEND_IN_RIAL || 'true').toLowerCase() !== 'false';
  const val = Math.round(Number(amountToman || 0));
  return sendInRial ? val * 10 : val;
}

function getZpEndpoints() {
  const isSandbox = String(process.env.ZARINPAL_SANDBOX || 'true').toLowerCase() !== 'false';
  const apiBase = isSandbox ? 'https://sandbox.zarinpal.com' : 'https://api.zarinpal.com';
  const startBase = isSandbox ? 'https://sandbox.zarinpal.com' : 'https://www.zarinpal.com';
  return {
    request: `${apiBase}/pg/v4/payment/request.json`,
    verify: `${apiBase}/pg/v4/payment/verify.json`,
    startPay: (authority) => `${startBase}/pg/StartPay/${authority}`
  };
}

// Create payment with Zarinpal (falls back to mock if MERCHANT_ID missing)
exports.create = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.fail('orderId الزامی است', 400);
    const order = await Order.findById(orderId);
    if (!order) return res.fail('سفارش پیدا نشد.', 404);
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const baseUrl = resolveBaseUrl(req);
    const amountGateway = toGatewayAmount(order.totalPrice);
    const callback_url = `${baseUrl}/api/payments/callback?orderId=${encodeURIComponent(String(order._id))}`;

    if (!merchantId) {
      // Mock fallback
      const redirectUrl = `${baseUrl}/checkout/payment?orderId=${encodeURIComponent(String(order._id))}&amount=${encodeURIComponent(order.totalPrice)}`;
      return res.success({ redirectUrl, authority: 'MOCK' });
    }

    const ep = getZpEndpoints();
    const body = {
      merchant_id: merchantId,
      amount: amountGateway,
      callback_url,
      description: `پرداخت سفارش ${order.orderNumber || order._id}`,
      metadata: {
        mobile: order.contactPhone || '',
        email: ''
      }
    };
    const r = await fetch(ep.request, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    const authority = d?.data?.authority;
    if (!r.ok || !authority) {
      const msg = d?.errors?.message || d?.errors || 'خطا در ایجاد تراکنش';
      return res.fail(msg, 500);
    }
    const redirectUrl = ep.startPay(authority);
    res.success({ redirectUrl, authority });
  } catch (err) { next(err); }
};

// Callback (GET): verify payment and update order status
exports.callback = async (req, res, next) => {
  try {
    const { Authority, Status, orderId } = req.query;
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const frontBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    if (!orderId) return res.redirect(`${frontBase}/checkout/payment?paid=0&msg=order_missing`);
    const order = await Order.findById(orderId);
    if (!order) return res.redirect(`${frontBase}/checkout/payment?paid=0&msg=order_not_found`);

    if (String(Status).toUpperCase() !== 'OK' || !Authority) {
      return res.redirect(`${frontBase}/checkout/payment?paid=0&orderId=${encodeURIComponent(String(order._id))}`);
    }
    
    // اگر merchant ID وجود نداره، این یک پرداخت mock است
    if (!merchantId) {
      // پرداخت mock موفق
      order.status = 'paid';
      order.paidAt = new Date();
      await order.save();
      return res.redirect(`${frontBase}/checkout/payment?paid=1&orderId=${encodeURIComponent(String(order._id))}&ref_id=MOCK_${Date.now()}`);
    }
    const ep = getZpEndpoints();
    const verifyBody = {
      merchant_id: merchantId,
      amount: toGatewayAmount(order.totalPrice),
      authority: Authority
    };
    const vr = await fetch(ep.verify, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(verifyBody) });
    const vd = await vr.json();
    const code = vd?.data?.code;
    const ref_id = vd?.data?.ref_id;
    if (vr.ok && (code === 100 || code === 101)) {
      order.status = 'paid';
      order.paidAt = new Date();
      await order.save();
      return res.redirect(`${frontBase}/checkout/payment?paid=1&orderId=${encodeURIComponent(String(order._id))}&ref_id=${encodeURIComponent(String(ref_id||''))}`);
    }
    return res.redirect(`${frontBase}/checkout/payment?paid=0&orderId=${encodeURIComponent(String(order._id))}`);
  } catch (err) { next(err); }
};







const axios = require('axios');

async function sendViaMelipayamak({ to, text }) {
  const username = process.env.MELI_USERNAME;
  const password = process.env.MELI_PASSWORD;
  const from = process.env.MELI_FROM || process.env.MELI_SENDER || '';
  if (!username || !password || !from) {
    console.warn('[SMS][MeliPayamak] Missing credentials or sender. Falling back to console log.');
    console.log('[SMS][FAKE]', to, text);
    return { ok: true, mode: 'dev' };
  }
  const url = 'https://rest.payamak-panel.com/api/SendSMS/V1/SendSMS';
  const payload = {
    username,
    password,
    to: Array.isArray(to) ? to : [to],
    from,
    text,
    isFlash: false,
  };
  const resp = await axios.post(url, payload, { timeout: 10000 });
  return { ok: true, provider: 'melipayamak', data: resp.data };
}

module.exports.sendSms = async function sendSms(phone, message) {
  try {
    // Basic normalization for Iranian mobile format
    const to = String(phone || '').trim();
    const text = String(message || '').trim();
    if (!to || !text) return { ok: false, error: 'invalid_params' };
    const res = await sendViaMelipayamak({ to, text });
    return res;
  } catch (e) {
    console.error('SMS error:', e.message);
    return { ok: false, error: e.message };
  }
};




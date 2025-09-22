const CourierMessage = require('../models/CourierMessage');

let fetchImpl = null;
try { fetchImpl = require('node-fetch'); } catch (_) { fetchImpl = null; }

function getEnv(){
  return {
    token: process.env.WHATSAPP_CLOUD_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    setEphemeral: String(process.env.WHATSAPP_SET_EPHEMERAL || '').toLowerCase() === 'true'
  };
}

async function httpFetch(url, options){
  const f = global.fetch || fetchImpl;
  if (!f) throw new Error('fetch not available');
  return f(url, options);
}

exports.sendOrderToCourier = async ({ toPhone, body, expiresInSeconds = 86400 }) => {
  const { token, phoneNumberId, setEphemeral } = getEnv();
  if (!token || !phoneNumberId) {
    const waLink = `https://wa.me/${encodeURIComponent(toPhone)}?text=${encodeURIComponent(body)}`;
    return { mode: 'link', waLink };
  }
  const base = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  // optionally set ephemeral
  if (setEphemeral) {
    try {
      const settingsPayload = {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'settings',
        settings: { ephemeral: { duration: expiresInSeconds } }
      };
      await httpFetch(base, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload)
      });
    } catch (_) {}
  }
  // send text message
  const res = await httpFetch(base, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toPhone, type: 'text', text: { body } })
  });
  const data = await res.json();
  if (!res.ok) {
    const waLink = `https://wa.me/${encodeURIComponent(toPhone)}?text=${encodeURIComponent(body)}`;
    return { mode: 'link', waLink, error: data?.error?.message || 'wa_send_failed' };
  }
  const messageId = data?.messages?.[0]?.id;
  return { mode: 'api', messageId };
};

exports.deleteMessage = async (messageId) => {
  const { token, phoneNumberId } = getEnv();
  if (!token || !phoneNumberId || !messageId) return { ok: false, reason: 'missing_config' };
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages?message_id=${encodeURIComponent(messageId)}`;
  const res = await httpFetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch (_) {}
    return { ok: false, reason: text || `status_${res.status}` };
  }
  return { ok: true };
};

exports.scheduleDeletion = async () => {
  const now = new Date();
  const expired = await CourierMessage.find({ status: { $in: ['sent'] }, expiresAt: { $lte: now } }).limit(50);
  for (const msg of expired) {
    try {
      if (msg.whatsappMessageId) {
        const del = await exports.deleteMessage(msg.whatsappMessageId);
        if (del.ok) { msg.status = 'deleted'; } else { msg.status = 'failed'; msg.error = del.reason; }
      } else {
        msg.status = 'failed'; msg.error = 'no_message_id';
      }
      await msg.save();
    } catch (e) {
      try { msg.status = 'failed'; msg.error = String(e.message || e); await msg.save(); } catch(_){}
    }
  }
};



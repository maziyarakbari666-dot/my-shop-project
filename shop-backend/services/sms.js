module.exports.sendSms = async function sendSms(phone, message) {
  try {
    // Integrate with real provider here using env vars (e.g., Kavenegar, Ghasedak, Twilio)
    // For now, just log to server for development
    console.log('[SMS]', phone, message);
    return { ok: true };
  } catch (e) {
    console.error('SMS error:', e.message);
    return { ok: false, error: e.message };
  }
};




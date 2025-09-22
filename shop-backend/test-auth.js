// Simple E2E auth test: send-otp -> verify-otp (captures cookie) -> me
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

async function jsonFetch(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, ok: r.ok, data, raw: r };
}

(async () => {
  try {
    const phone = '09123456789';
    const sendRes = await jsonFetch(baseUrl + '/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    console.log('send-otp:', sendRes.status, sendRes.data);
    if (!sendRes.ok || !sendRes.data?.debugCode) {
      console.log('send-otp failed or debugCode missing (prod?)');
      process.exit(sendRes.ok ? 0 : 1);
    }
    const code = sendRes.data.debugCode;

    const verifyRes = await fetch(baseUrl + '/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const verifyJson = await verifyRes.json().catch(() => ({}));
    const setCookieHeader = verifyRes.headers.get('set-cookie') || (verifyRes.headers.raw && verifyRes.headers.raw()['set-cookie']?.[0]) || '';
    const authCookie = setCookieHeader.split(';')[0] || '';
    console.log('verify-otp:', verifyRes.status, verifyJson);
    if (!verifyRes.ok || !authCookie) {
      console.log('verify-otp failed or cookie missing');
      process.exit(1);
    }

    const meRes = await fetch(baseUrl + '/api/auth/me', {
      headers: { Cookie: authCookie }
    });
    const meJson = await meRes.json().catch(() => ({}));
    console.log('me:', meRes.status, meJson);
    process.exit(meRes.ok ? 0 : 1);
  } catch (e) {
    console.error('Test error:', e.message);
    process.exit(1);
  }
})();




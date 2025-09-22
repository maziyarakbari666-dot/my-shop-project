'use client';

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const BASE_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // Parse response safely: prefer JSON; gracefully fallback to text
  const parseResponse = async (res) => {
    const contentType = res.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      try { return await res.json(); } catch (_) { return { error: 'پاسخ نامعتبر از سرور' }; }
    }
    const text = await res.text().catch(() => '');
    try { return JSON.parse(text); } catch(_) { return { error: text || 'پاسخ نامعتبر از سرور' }; }
  };

  const normalizeDigits = (input) => {
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    const ar = '٠١٢٣٤٥٦٧٨٩';
    let s = String(input || '')
      .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
      .replace(/[^0-9+]/g, '');
    if (s.startsWith('+98')) s = '0' + s.slice(3);
    else if (s.startsWith('0098')) s = '0' + s.slice(4);
    else if (s.startsWith('98') && s.length >= 12) s = '0' + s.slice(2);
    return s;
  };

  async function handleSendSms(e) {
    e.preventDefault();
    console.log("handleSendSms called");
    const normalized = normalizeDigits(phone);
    if (!/^09\d{9}$/.test(normalized)) {
      setError("شماره موبایل معتبر وارد کنید");
      toast.error("شماره موبایل معتبر وارد کنید");
      return;
    }
    if (cooldownLeft > 0 || sending) return;
    try {
      setSending(true);
      const res = await fetch(`${BASE_API}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized })
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        if (res.status === 429) {
          // Rate limited: extract wait seconds
          const ra = res.headers?.get?.('retry-after');
          const rl = res.headers?.get?.('ratelimit-reset');
          let wait = parseInt(ra || '', 10);
          if (!wait || Number.isNaN(wait)) wait = parseInt(rl || '', 10);
          if (!wait || Number.isNaN(wait)) wait = 60;
          setCooldownLeft(wait);
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = setInterval(() => {
            setCooldownLeft((s) => {
              if (s <= 1) { clearInterval(cooldownRef.current); return 0; }
              return s - 1;
            });
          }, 1000);
          const msg = data?.error || data?.message || 'تعداد درخواست بیش از حد مجاز است.';
          setError(msg);
          toast.error(msg);
          return;
        }
        throw new Error(data?.error || data?.message || 'خطا در ارسال کد');
      }
      setError("");
      setSentCode(true);
      setStep(2);
      toast.success("کد یکبار مصرف ارسال شد!");
      if (data?.debugCode) console.log('OTP (dev):', data.debugCode);
    } catch (err) {
      const msg = (err && err.message) ? err.message : 'خطا در ارسال کد';
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const normalized = normalizeDigits(phone);
      const res = await fetch(`${BASE_API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: normalized, code })
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data?.error || data?.message || 'کد وارد شده اشتباه است');
      setError("");
      toast.success("ورود موفقیت‌آمیز بود!");
      if (typeof window !== "undefined") {
        localStorage.setItem("user_phone", phone);
        localStorage.setItem("user_logged_in", "true");
        localStorage.setItem("auth_token", data?.token || "");
        // If backend returns a user with name, store it for UI
        if (data?.user?.name) {
          localStorage.setItem('user_name', data.user.name);
        }
      }
      // اطمینان از به‌روزرسانی وضعیت در کل اپ
      if (typeof window !== 'undefined') {
        try { window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token' })); } catch(_) {}
        setTimeout(() => { window.location.href = '/account'; }, 400);
      } else {
        router.push('/account');
      }
    } catch (err) {
      setError(err.message || "کد وارد شده اشتباه است");
      toast.error(err.message || "کد وارد شده اشتباه است");
    }
  }

  return (
    <div style={{
      maxWidth: 420,
      margin: "60px auto",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 18px #eee",
      fontFamily: "Vazirmatn,sans-serif",
      padding: "38px 28px",
      textAlign: "center"
    }}>
      <h2 style={{
        fontWeight: "bold", fontSize: 24, color: "var(--accent)", marginBottom: 22
      }}>
        ورود به حساب کاربری
      </h2>
      {step === 1 && (
        <form onSubmit={handleSendSms}>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(normalizeDigits(e.target.value))}
            required
            style={{
              width: "100%", padding: "11px 13px", borderRadius: 8,
              border: "1px solid #ddd", fontSize: 16, marginBottom: 16
            }}
            placeholder="شماره موبایل (مثلاً 09121234567)"
            inputMode="numeric"
          />
          <button
            type="submit"
            onClick={() => console.log("Button clicked!")}
            disabled={sending || cooldownLeft > 0}
            style={{
              width: "100%",
              background: (sending || cooldownLeft > 0) ? "#f4b27a" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "13px",
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {cooldownLeft > 0 ? `ارسال مجدد در ${cooldownLeft} ثانیه` : (sending ? 'در حال ارسال...' : 'دریافت کد یکبار مصرف')}
          </button>
          {error && <div style={{
            color: "#c0392b", fontSize: 15, marginTop: 13
          }}>{error}</div>}
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleLogin}>
          <div style={{ fontSize: 17, color: "#888", marginBottom: 11 }}>
            کد ارسال‌شده به شماره <b>{phone}</b> را وارد کنید:
          </div>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={6}
            style={{
              width: "100%", padding: "11px 13px", borderRadius: 8,
              border: "1px solid #ddd", fontSize: 17, letterSpacing: 4, marginBottom: 16, textAlign: "center"
            }}
            placeholder="مثلاً 123456"
          />
          <button type="submit" style={{
            width: "100%", background: "var(--accent)", color: "#fff", border: "none",
            borderRadius: 8, padding: "13px", fontSize: 18, fontWeight: "bold", cursor: "pointer"
          }}>
            ورود به حساب
          </button>
          {error && <div style={{
            color: "#c0392b", fontSize: 15, marginTop: 13
          }}>{error}</div>}
        </form>
      )}
    </div>
  );
}

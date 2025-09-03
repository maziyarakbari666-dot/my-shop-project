'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // اضافه شد

// دمو: فرض می‌کنیم فقط یک کد معتبر وجود دارد
const DEMO_CODE = "123456";

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSendSms(e) {
    e.preventDefault();
    if (!/^09\d{9}$/.test(phone)) {
      setError("شماره موبایل معتبر وارد کنید");
      toast.error("شماره موبایل معتبر وارد کنید"); // Toast خطا
      return;
    }
    setError("");
    setSentCode(true);
    setStep(2);
    toast.success("کد یکبار مصرف ارسال شد!"); // Toast موفقیت
    // در واقعیت باید اینجا API پیامک فراخوانی شود
  }

  function handleLogin(e) {
    e.preventDefault();
    if (code !== DEMO_CODE) {
      setError("کد وارد شده اشتباه است");
      toast.error("کد وارد شده اشتباه است"); // Toast خطا
      return;
    }
    setError("");
    toast.success("ورود موفقیت‌آمیز بود!"); // Toast موفقیت
    // ذخیره وضعیت ورود (دمو)
    if (typeof window !== "undefined") {
      localStorage.setItem("user_phone", phone);
      localStorage.setItem("user_logged_in", "true");
    }
    setTimeout(() => {
      router.push("/");
    }, 1200); // تا Toast نمایش داده شود بعد هدایت شود
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
        fontWeight: "bold", fontSize: 24, color: "#27ae60", marginBottom: 22
      }}>
        ورود به حساب کاربری
      </h2>
      {step === 1 && (
        <form onSubmit={handleSendSms}>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            style={{
              width: "100%", padding: "11px 13px", borderRadius: 8,
              border: "1px solid #ddd", fontSize: 16, marginBottom: 16
            }}
            placeholder="شماره موبایل (مثلاً 09121234567)"
          />
          <button type="submit" style={{
            width: "100%", background: "#27ae60", color: "#fff", border: "none",
            borderRadius: 8, padding: "13px", fontSize: 18, fontWeight: "bold", cursor: "pointer"
          }}>
            دریافت کد یکبار مصرف
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
            width: "100%", background: "#27ae60", color: "#fff", border: "none",
            borderRadius: 8, padding: "13px", fontSize: 18, fontWeight: "bold", cursor: "pointer"
          }}>
            ورود به حساب
          </button>
          {error && <div style={{
            color: "#c0392b", fontSize: 15, marginTop: 13
          }}>{error}</div>}
        </form>
      )}
      {step === 2 && (
        <div style={{
          fontSize: 15, color: "#888", marginTop: 18
        }}>
          (کد دمو برای تست: <b style={{ color: "#e67e22" }}>{DEMO_CODE}</b> )
        </div>
      )}
    </div>
  );
}
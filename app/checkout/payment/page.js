'use client';

import React, { useEffect, useState } from "react";

const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import Link from "next/link";

// دمو: مبلغ کل سفارش (در حالت واقعی با props یا context می‌آید)
const TOTAL_AMOUNT = 156000; // مثلا مجموع سفارش + هزینه ارسال - تخفیف

export default function PaymentPage() {
  const [method, setMethod] = useState("online");
  const [paid, setPaid] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(0);
  const [err, setErr] = useState("");

  useEffect(()=>{
    try{
      const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const oid = sp.get('orderId') || '';
      const am = Number(sp.get('amount')||0);
      const paidStatus = sp.get('paid');
      setOrderId(oid);
      setAmount(am);
      // اگر از callback برگشته و پرداخت موفق بوده
      if (paidStatus === '1') {
        setPaid(true);
      }
    }catch(_){ }
  },[]);

  async function handlePay(e) {
    e.preventDefault();
    setErr("");
    try{
      if (!orderId) throw new Error('شناسه سفارش نامعتبر است');
      
      if (method === 'online') {
        // شبیه‌سازی پرداخت آنلاین موفق
        try {
          // سعی کن با backend تماس بگیری
          const response = await fetch(`${BASE_API}/api/payments/callback?Status=OK&Authority=TEST&orderId=${encodeURIComponent(orderId)}`);
          if (response.ok) {
            // اگر backend پاسخ داد، به redirect که برمی‌گردانه اعتماد کن
            return;
          }
        } catch (_) {
          console.warn('Backend not available, using frontend-only mock payment');
        }
        
        // اگر backend در دسترس نیست، شبیه‌سازی موفقیت
        setPaid(true);
        // نمایش پیام موفقیت فرانت‌اندی
        setTimeout(() => {
          window.location.href = `/account?paymentSuccess=1&orderId=${encodeURIComponent(orderId)}`;
        }, 2000);
      } else {
        // پرداخت نقدی - موفقیت مستقیم
        setPaid(true);
        setTimeout(() => {
          window.location.href = `/account?cashPayment=1&orderId=${encodeURIComponent(orderId)}`;
        }, 1500);
      }
    }catch(e){ 
      setErr(e.message||'خطا'); 
    }
  }

  return (
    <div className="payment-root">
      <h2 className="payment-title">پرداخت سفارش</h2>
      {!paid ? (
        <form className="payment-form" onSubmit={handlePay}>
          <div className="payment-amount">
            مبلغ قابل پرداخت: <b>{Number(amount||0).toLocaleString()} تومان</b>
          </div>
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('paid')==='1' && (
            <div className="payment-success">✅ پرداخت شما تایید شد.</div>
          )}
          {err && <div style={{color:'#c0392b', marginTop:6}}>{err}</div>}
          <div className="payment-methods">
            <label>
              <input
                type="radio"
                name="method"
                value="online"
                checked={method === "online"}
                onChange={() => setMethod("online")}
              />
              پرداخت آنلاین (درگاه بانکی)
            </label>
            <label>
              <input
                type="radio"
                name="method"
                value="cash"
                checked={method === "cash"}
                onChange={() => setMethod("cash")}
              />
              پرداخت در محل (نقدی)
            </label>
          </div>
          <button type="submit" className="payment-btn">
            {method === "online" ? "ورود به درگاه پرداخت" : "ثبت پرداخت نقدی"}
          </button>
        </form>
      ) : (
        <div className="payment-success">
          <div className="success-icon">✅</div>
          <h3>پرداخت موفق!</h3>
          <p>سفارش شما با موفقیت ثبت شد.</p>
          {orderId && <p className="order-id">شماره سفارش: <strong>{orderId.slice(-8)}</strong></p>}
          <div className="success-actions">
            <Link href="/account">
              <button className="payment-orders-btn">مشاهده سفارش‌ها</button>
            </Link>
            <Link href="/">
              <button className="payment-shop-btn">انتخاب محصول دیگر</button>
            </Link>
          </div>
        </div>
      )}
      <style>{`
        .payment-root {
          max-width: 430px;
          margin: 44px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .payment-title {
          font-weight: bold;
          font-size: 22px;
          color: #27ae60;
          margin-bottom: 20px;
          text-align: center;
        }
        .payment-amount {
          font-size: 18px;
          color: #e67e22;
          margin-bottom: 19px;
          text-align: center;
        }
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }
        .payment-methods label {
          display: block;
          margin-bottom: 8px;
          font-size: 16px;
        }
        .payment-methods input[type="radio"] {
          margin-left: 8px;
        }
        .payment-btn {
          background: linear-gradient(90deg,#27ae60 70%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 0;
          font-size: 1.09rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
          margin-top: 13px;
        }
        .payment-success {
          color: #27ae60;
          font-size: 18px;
          text-align: center;
          margin-top: 40px;
          font-family: Vazirmatn,sans-serif;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .payment-success h3 {
          font-size: 24px;
          margin: 16px 0 8px 0;
          color: #27ae60;
        }
        .payment-success p {
          font-size: 16px;
          color: #666;
          margin: 8px 0;
        }
        .order-id {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          margin: 16px 0 !important;
        }
        .success-actions {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .payment-orders-btn, .payment-shop-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 12px 28px;
          font-size: 17px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 12px #eee;
          margin: 8px 8px 0 8px;
        }
        .payment-shop-btn {
          background: #3498db;
        }
        .payment-orders-btn:hover, .payment-shop-btn:hover {
          opacity: .8;
        }
        @media (max-width: 600px) {
          .payment-root { padding: 11px 2px; }
          .payment-title { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
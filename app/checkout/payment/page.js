'use client';

import React, { useState } from "react";
import Link from "next/link";

// دمو: مبلغ کل سفارش (در حالت واقعی با props یا context می‌آید)
const TOTAL_AMOUNT = 156000; // مثلا مجموع سفارش + هزینه ارسال - تخفیف

export default function PaymentPage() {
  const [method, setMethod] = useState("online");
  const [paid, setPaid] = useState(false);

  function handlePay(e) {
    e.preventDefault();
    setPaid(true);
    // در حالت واقعی: ارسال به درگاه و تایید پرداخت
  }

  return (
    <div className="payment-root">
      <h2 className="payment-title">پرداخت سفارش</h2>
      {!paid ? (
        <form className="payment-form" onSubmit={handlePay}>
          <div className="payment-amount">
            مبلغ قابل پرداخت: <b>{TOTAL_AMOUNT.toLocaleString()} تومان</b>
          </div>
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
          ✅ پرداخت شما با موفقیت ثبت شد!
          <div style={{ marginTop: 22 }}>
            <Link href="/orders">
              <button className="payment-orders-btn">مشاهده سفارش‌های من</button>
            </Link>
            <Link href="/">
              <button className="payment-shop-btn">بازگشت به فروشگاه</button>
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
          font-size: 21px;
          text-align: center;
          margin-top: 55px;
          font-family: Vazirmatn,sans-serif;
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
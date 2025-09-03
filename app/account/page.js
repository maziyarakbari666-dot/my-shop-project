'use client';

import React, { useState } from "react";
import toast from "react-hot-toast";

const ordersDemo = [
  {
    id: "ORD-101",
    date: "1402/06/10",
    status: "پرداخت شده",
    items: [
      { name: "نان تست", qty: 2, price: 20000 },
      { name: "شیرینی خامه‌ای", qty: 1, price: 50000 },
    ],
    total: 90000,
    type: "معمولی"
  },
  {
    id: "ORD-102",
    date: "1402/06/08",
    status: "تکمیل شده",
    items: [
      { name: "سبزیجات آماده", qty: 1, price: 30000 },
    ],
    total: 30000,
    type: "BNPL"
  }
];

const walletDemo = { balance: 120000 };

const addressesDemo = [
  "تهران، خیابان آزادی، ساختمان 12، واحد 3",
  "تهران، خیابان ولیعصر، پلاک 24، واحد 1"
];

const bnplDemo = {
  paid: 2,
  total: 4,
  nextDue: "1402/07/01",
  remaining: 40000
};

export default function AccountPage() {
  const [addresses, setAddresses] = useState(addressesDemo);
  const [newAddress, setNewAddress] = useState("");
  const userPhone =
    typeof window !== "undefined"
      ? localStorage.getItem("user_phone") || "شماره ثبت نشده"
      : "شماره ثبت نشده";

  function handleAddAddress(e) {
    e.preventDefault();
    if (newAddress.trim()) {
      setAddresses([...addresses, newAddress.trim()]);
      toast.success("آدرس جدید با موفقیت ثبت شد!");
      setNewAddress("");
    } else {
      toast.error("لطفا آدرس معتبر وارد کنید.");
    }
  }
  function handleDeleteAddress(idx) {
    setAddresses(addresses.filter((_, i) => i !== idx));
    toast.success("آدرس با موفقیت حذف شد.");
  }

  return (
    <div className="account-root">
      <h2 className="account-title">
        <span className="account-icon">👤</span> پنل کاربری
      </h2>

      {/* اطلاعات کاربر */}
      <div className="account-box account-info">
        <div className="info-row">
          <span className="info-label">شماره موبایل:</span>
          <span className="info-value">{userPhone}</span>
        </div>
      </div>

      {/* سفارش‌ها */}
      <div className="account-box account-orders">
        <h3 className="section-title">📦 سفارش‌های من</h3>
        {ordersDemo.length === 0 ? (
          <div className="empty-text">هنوز سفارشی ثبت نکرده‌اید.</div>
        ) : (
          ordersDemo.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">{order.id}</span>
                <span className={`order-status ${order.status === "تکمیل شده" ? "order-success" : "order-warn"}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-meta">
                <span className="order-date">🗓 {order.date}</span>
                <span className="order-type">{order.type === "BNPL" ? "اعتباری" : "معمولی"}</span>
              </div>
              <div className="order-items">
                {order.items.map((item, idx) => (
                  <span key={idx} className="order-item">
                    {item.name} <b>× {item.qty}</b>
                    <span className="order-price">({(item.price * item.qty).toLocaleString()} تومان)</span>
                    {idx < order.items.length - 1 && <span className="order-dot">•</span>}
                  </span>
                ))}
              </div>
              <div className="order-total">
                جمع کل: <span>{order.total.toLocaleString()} تومان</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* کیف پول */}
      <div className="account-box account-wallet">
        <h3 className="section-title">💳 کیف پول</h3>
        <div className="wallet-info">
          موجودی:
          <span className="wallet-balance">
            {walletDemo.balance.toLocaleString()} تومان
          </span>
        </div>
        <button className="wallet-btn">
          واریز وجه
        </button>
      </div>

      {/* آدرس‌ها */}
      <div className="account-box account-addresses">
        <h3 className="section-title">📍 آدرس‌های من</h3>
        {addresses.length === 0 ? (
          <div className="empty-text">هنوز آدرسی ثبت نکرده‌اید.</div>
        ) : (
          addresses.map((address, idx) => (
            <div key={idx} className="address-row">
              <span className="address-text">{address}</span>
              <button className="address-delete-btn" onClick={() => handleDeleteAddress(idx)}>
                حذف
              </button>
            </div>
          ))
        )}
        <form onSubmit={handleAddAddress} className="address-form">
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder="آدرس جدید"
            className="address-input"
          />
          <button type="submit" className="address-add-btn">
            ثبت آدرس
          </button>
        </form>
      </div>

      {/* BNPL */}
      <div className="account-box account-bnpl">
        <h3 className="section-title">💸 خرید اعتباری (BNPL)</h3>
        <div className="bnpl-row">
          <span>اقساط پرداخت‌شده:</span>
          <b>{bnplDemo.paid}</b> / <b>{bnplDemo.total}</b>
        </div>
        <div className="bnpl-row">
          <span>مبلغ باقی‌مانده:</span>
          <span className="bnpl-amount">{bnplDemo.remaining.toLocaleString()} تومان</span>
        </div>
        <div className="bnpl-row">
          <span>تاریخ سررسید قسط بعدی:</span>
          <b>{bnplDemo.nextDue}</b>
        </div>
      </div>

      {/* استایل مدرن و ریسپانسیو */}
      <style>{`
        .account-root {
          max-width: 880px;
          margin: 34px auto;
          background: #f8fafc;
          border-radius: 22px;
          box-shadow: 0 8px 38px #e2e6ea;
          font-family: Vazirmatn,sans-serif;
          padding: 26px 16px;
        }
        .account-title {
          font-size: 2rem;
          font-weight: bold;
          color: #27ae60;
          text-align: center;
          margin-bottom: 27px;
          letter-spacing: 1px;
        }
        .account-icon {
          font-size: 2rem;
          margin-left: 7px;
        }
        .account-box {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 18px #eee;
          margin-bottom: 24px;
          padding: 22px 18px;
          transition: box-shadow .2s;
        }
        .account-box:hover {
          box-shadow: 0 6px 28px #d1f5e5;
        }
        .info-row {
          display: flex;
          gap: 8px;
          font-size: 1.08rem;
          color: #444;
        }
        .info-label {
          color: #27ae60;
          font-weight: bold;
        }
        .section-title {
          font-size: 1.2rem;
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .empty-text {
          color: #b0b0b0;
          font-size: 0.95rem;
          text-align: center;
          margin-bottom: 10px;
        }
        /* سفارش‌ها */
        .order-card {
          background: #f3f8f3;
          border-radius: 9px;
          box-shadow: 0 2px 10px #e0e0e0;
          margin-bottom: 14px;
          padding: 15px 12px 10px 12px;
          transition: box-shadow 0.2s;
        }
        .order-card:hover {
          box-shadow: 0 6px 26px #c8e6c9;
        }
        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .order-id {
          font-weight: bold;
          color: #213e32;
          letter-spacing: 1px;
        }
        .order-status {
          font-weight: bold;
          font-size: 15px;
          padding: 2px 14px;
          border-radius: 8px;
        }
        .order-success {
          color: #fff;
          background: #27ae60;
        }
        .order-warn {
          color: #fff;
          background: #e67e22;
        }
        .order-meta {
          display: flex;
          gap: 14px;
          margin-bottom: 5px;
          font-size: 14px;
          color: #888;
        }
        .order-items {
          margin-top: 6px;
          color: #222;
          font-size: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .order-item {
          display: flex;
          align-items: center;
        }
        .order-price {
          margin-right: 3px;
          color: #27ae60;
        }
        .order-dot {
          margin: 0 6px;
          color: #b0b0b0;
        }
        .order-total {
          font-weight: bold;
          color: #27ae60;
          font-size: 1.05rem;
          margin-top: 4px;
          background: #eafaf1;
          border-radius: 7px;
          padding: 3px 11px;
          display: inline-block;
        }
        /* کیف پول */
        .wallet-info {
          font-size: 1.07rem;
          color: #444;
          margin-bottom: 11px;
        }
        .wallet-balance {
          color: #e67e22;
          font-size: 1.14rem;
          margin-right: 8px;
          font-weight: bold;
        }
        .wallet-btn {
          background: linear-gradient(90deg,#27ae60 60%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 10px 26px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 1px 6px #e2e2e2;
          transition: background .2s;
        }
        .wallet-btn:hover {
          background: linear-gradient(90deg,#219150 60%,#43e97b 100%);
        }
        /* آدرس‌ها */
        .address-row {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 8px 13px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 6px #f0f0f0;
        }
        .address-text {
          font-size: 15px;
          color: #222;
        }
        .address-delete-btn {
          background: #c0392b;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 4px 13px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
        }
        .address-delete-btn:hover {
          background: #a93226;
        }
        .address-form {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .address-input {
          flex: 1;
          padding: 9px 15px;
          border-radius: 7px;
          border: 1px solid #ddd;
          font-size: 15px;
          background: #f5f5f5;
          transition: border-color .2s;
        }
        .address-input:focus {
          border-color: #27ae60;
          background: #eafaf1;
        }
        .address-add-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 9px 17px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 2px 8px #e3e3e3;
          transition: background .2s;
        }
        .address-add-btn:hover {
          background: #219150;
        }
        /* BNPL */
        .account-bnpl {
          background: linear-gradient(90deg,#f0f7f4 70%,#f8fafc 100%);
          border: 1.5px dashed #27ae60;
        }
        .bnpl-row {
          font-size: 1.02rem;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .bnpl-amount {
          color: #e67e22;
          font-weight: bold;
        }

        /* ریسپانسیو */
        @media (max-width: 900px) {
          .account-root {
            padding: 13px 3px;
          }
          .account-title {
            font-size: 1.3rem;
          }
          .account-box {
            padding: 16px 7px;
          }
          .section-title {
            font-size: 1rem;
          }
        }
        @media (max-width: 600px) {
          .account-root {
            padding: 4px 0;
          }
          .account-title {
            font-size: 1.1rem;
          }
          .account-box {
            margin-bottom: 19px;
            padding: 11px 3px;
          }
          .order-card {
            padding: 7px 2px 7px 2px;
          }
          .wallet-btn, .address-add-btn {
            font-size: 12px;
            padding: 8px 13px;
          }
          .address-input {
            font-size: 12px;
            padding: 7px 9px;
          }
          .address-row {
            padding: 7px 2px;
          }
          .bnpl-row {
            font-size: 0.96rem;
          }
        }
        @media (max-width: 400px) {
          .address-form {
            flex-direction: column;
            gap: 5px;
          }
          .address-input, .address-add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
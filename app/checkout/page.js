'use client';

import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";

// دمو: هزینه ارسال و تخفیف
const DELIVERY_FEE = 35000;
const DISCOUNT = 20000;

// دمو: مناطق ارسال
const REGIONS = ["منطقه 1", "منطقه 2", "منطقه 3", "منطقه 4", "منطقه 5"];

// دمو: بازه‌های زمانی تحویل
const TIME_SLOTS = [
  "8 تا 9",
  "9 تا 10",
  "10 تا 11",
  "11 تا 12",
  "12 تا 13",
  "13 تا 14",
  "14 تا 15",
  "15 تا 16",
  "16 تا 17",
  "17 تا 18",
];

// دمو: لیست آدرس‌ها
const mockAddresses = [
  {
    id: 1,
    text: "تهران، خیابان ولیعصر، کوچه مهر، ساختمان 21، واحد 4",
    region: "منطقه 1",
    plaque: "21",
    unit: "4",
    isDefault: true,
  },
  {
    id: 2,
    text: "تهران، شهرک غرب، خیابان ایران‌زمین، ساختمان 11، واحد 2",
    region: "منطقه 2",
    plaque: "11",
    unit: "2",
    isDefault: false,
  },
];

// تولید تاریخ‌های 7 روز آینده شمسی (دمو)
function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const jalaliDate = d.toLocaleDateString("fa-IR");
    days.push(jalaliDate);
  }
  return days;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalAmount = totalPrice + DELIVERY_FEE - DISCOUNT;

  const [form, setForm] = useState({
    phone: "",
    date: getNext7Days()[0],
    time: TIME_SLOTS[0],
  });
  const [selectedAddressId, setSelectedAddressId] = useState(
    mockAddresses.find(a => a.isDefault)?.id || mockAddresses[0].id
  );
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(true);
    clearCart();
    // سفارش باید با selectedAddressId ثبت شود!
  }

  if (cart.length === 0 && !success) {
    return (
      <div className="checkout-empty">
        سبد خرید شما خالی است!
        <br />
        <Link href="/"><button className="checkout-back-btn">بازگشت به فروشگاه</button></Link>
        <style>{`
          .checkout-empty {
            max-width: 600px;
            margin: 60px auto;
            text-align: center;
            font-family: Vazirmatn,sans-serif;
            font-size: 19px;
            color: #888;
          }
          .checkout-back-btn {
            margin-top: 18px;
            background: #27ae60;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 11px 38px;
            font-size: 17px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 12px #eee;
            transition: background .2s;
          }
          .checkout-back-btn:hover {
            background: #219150;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkout-root">
      {!success ? (
        <>
          <h2 className="checkout-title">
            <span className="checkout-icon">📝</span>
            تکمیل اطلاعات و ثبت سفارش
          </h2>
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>شماره موبایل:</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="0912xxxxxxx"
              />
            </div>
            <div className="form-row">
              <label>انتخاب آدرس ارسال:</label>
              <div className="address-list">
                {mockAddresses.map(addr => (
                  <label key={addr.id} className={`address-item${selectedAddressId === addr.id ? " address-selected" : ""}`}>
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <span>{addr.text}</span>
                    <span className="address-region">{addr.region}</span>
                    {addr.isDefault && <span className="address-default-label">پیش‌فرض</span>}
                  </label>
                ))}
                <Link href="/address/add">
                  <button type="button" className="address-add-btn">افزودن آدرس جدید</button>
                </Link>
              </div>
            </div>
            <div className="form-row-flex">
              <div>
                <label>تاریخ دریافت سفارش:</label>
                <select
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                >
                  {getNext7Days().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label>بازه زمانی:</label>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="checkout-submit-btn">
              ثبت سفارش
            </button>
          </form>
          <div className="checkout-summary">
            <div className="summary-title">خلاصه سفارش شما</div>
            <div className="summary-list">
              {cart.map(item => (
                <div key={item.id} className="summary-row">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString()} تومان</span>
                </div>
              ))}
              <div className="summary-row">
                <span>هزینه ارسال</span>
                <span>{DELIVERY_FEE.toLocaleString()} تومان</span>
              </div>
              <div className="summary-row summary-discount">
                <span>تخفیف</span>
                <span>- {DISCOUNT.toLocaleString()} تومان</span>
              </div>
              <div className="summary-row summary-final">
                <span>مبلغ قابل پرداخت</span>
                <span>{finalAmount.toLocaleString()} تومان</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="checkout-success">
          <div className="success-title">✅ سفارش شما با موفقیت ثبت شد!</div>
          <div>سفارش شما در تاریخ <b>{form.date}</b> و بازه <b>{form.time}</b> ارسال خواهد شد.</div>
          <div style={{ marginTop: 22 }}>
            <Link href="/"><button className="checkout-back-btn">بازگشت به فروشگاه</button></Link>
          </div>
        </div>
      )}
      <style>{`
        .checkout-root {
          max-width: 820px;
          margin: 44px auto;
          background: #f8fafc;
          border-radius: 22px;
          box-shadow: 0 8px 38px #e2e6ea;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 17px;
        }
        .checkout-title {
          font-weight: bold;
          font-size: 2rem;
          color: #27ae60;
          margin-bottom: 28px;
          text-align: center;
        }
        .checkout-icon {
          font-size: 2.2rem;
          margin-left: 7px;
        }
        .checkout-form {
          margin-bottom: 32px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
          background: #fff;
          border-radius: 13px;
          box-shadow: 0 2px 14px #eee;
          padding: 23px 13px 13px 13px;
        }
        .form-row {
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
        }
        .form-row label {
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 6px;
        }
        .form-row input,
        .form-row select {
          width: 100%;
          padding: 9px 13px;
          border-radius: 7px;
          border: 1px solid #ddd;
          font-size: 16px;
          background: #f7f7f7;
          transition: border-color .2s;
        }
        .form-row input:focus,
        .form-row select:focus {
          border-color: #27ae60;
          background: #eafaf1;
        }
        .address-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 9px;
        }
        .address-item {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #f8fafc;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          border: 1.5px solid #eee;
          font-size: 15px;
        }
        .address-selected {
          border: 2.5px solid #27ae60;
          background: #eafaf1;
        }
        .address-region {
          color: #3498db;
          margin-right: 8px;
          font-size: 13px;
        }
        .address-default-label {
          background: #27ae60;
          color: #fff;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 7px;
          margin-right: 6px;
          font-weight: bold;
        }
        .address-add-btn {
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 7px 18px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 7px;
        }
        .form-row-flex {
          display: flex;
          gap: 18px;
          margin-bottom: 14px;
        }
        .form-row-flex > div {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .form-row-flex label {
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 6px;
        }
        .form-row-flex input,
        .form-row-flex select {
          padding: 9px 13px;
          border-radius: 7px;
          border: 1px solid #ddd;
          font-size: 16px;
          background: #f7f7f7;
          transition: border-color .2s;
        }
        .form-row-flex input:focus,
        .form-row-flex select:focus {
          border-color: #27ae60;
          background: #eafaf1;
        }
        .checkout-submit-btn {
          width: 100%;
          background: linear-gradient(90deg,#27ae60 60%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 14px;
          box-shadow: 0 2px 12px #e2e2e2;
          transition: background .2s;
        }
        .checkout-submit-btn:hover {
          background: linear-gradient(90deg,#219150 60%,#43e97b 100%);
        }
        .checkout-summary {
          background: #fff;
          border-radius: 13px;
          padding: 22px 18px;
          box-shadow: 0 2px 14px #eee;
          margin-bottom: 0;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
          margin-top: 18px;
        }
        .summary-title {
          font-weight: bold;
          font-size: 1.2rem;
          color: #27ae60;
          margin-bottom: 13px;
          text-align: center;
        }
        .summary-list {
          margin-bottom: 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .summary-discount {
          color: #e67e22;
        }
        .summary-final {
          font-weight: bold;
          font-size: 18px;
          color: #27ae60;
          margin-top: 8px;
        }
        .checkout-success {
          text-align: center;
          color: #27ae60;
          font-size: 22px;
          padding: 70px 0;
          font-family: Vazirmatn,sans-serif;
        }
        .success-title {
          font-weight: bold;
          font-size: 26px;
          margin-bottom: 16px;
        }
        .checkout-back-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 12px 38px;
          font-size: 17px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 12px #eee;
          transition: background .2s;
        }
        .checkout-back-btn:hover {
          background: #219150;
        }

        /* ریسپانسیو */
        @media (max-width: 900px) {
          .checkout-root {
            padding: 17px 2px;
          }
          .checkout-title {
            font-size: 1.3rem;
          }
          .checkout-form, .checkout-summary {
            padding: 13px 6px;
          }
        }
        @media (max-width: 600px) {
          .checkout-root {
            padding: 5px 0;
          }
          .checkout-title {
            font-size: 1.1rem;
          }
          .checkout-form {
            padding: 8px 2px;
          }
          .form-row input,
          .form-row select,
          .form-row-flex input,
          .form-row-flex select {
            font-size: 13px;
            padding: 7px 7px;
          }
          .checkout-submit-btn {
            font-size: 15px;
            padding: 11px;
          }
          .checkout-summary {
            padding: 10px 2px;
          }
          .summary-row {
            font-size: 14px;
          }
          .summary-title {
            font-size: 1rem;
          }
        }
        @media (max-width: 440px) {
          .form-row-flex {
            flex-direction: column;
            gap: 7px;
          }
        }
      `}</style>
    </div>
  );
}
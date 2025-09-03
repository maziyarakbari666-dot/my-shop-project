'use client';

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// دمو: اطلاعات سفارش و فاکتور (در حالت واقعی باید از API یا سرور خوانده شود)
const mockInvoice = {
  id: "ORD123456",
  date: "1404/06/10",
  time: "9 تا 10",
  customer: {
    name: "رضا رضایی",
    phone: "09121112233",
    address: "تهران، خیابان ولیعصر، کوچه مهر، ساختمان 21، واحد 4",
  },
  items: [
    { name: "نان تست", qty: 2, price: 20000 },
    { name: "شیرینی مغزدار", qty: 1, price: 40000 },
    { name: "سبزی تازه", qty: 3, price: 15000 },
  ],
  delivery_fee: 35000,
  discount: 20000,
  total: 145000,
  paid: true,
  payment_method: "پرداخت آنلاین",
};

export default function InvoicePage() {
  const params = useParams();
  // در حالت واقعی: بر اساس params.orderId اطلاعات را fetch کن!
  const invoice = mockInvoice;

  return (
    <div className="invoice-root">
      <h2 className="invoice-title">فاکتور سفارش <b>{invoice.id}</b></h2>
      <div className="invoice-header">
        <div><b>مشتری:</b> {invoice.customer.name}</div>
        <div><b>شماره تماس:</b> {invoice.customer.phone}</div>
        <div><b>آدرس:</b> {invoice.customer.address}</div>
        <div><b>تاریخ سفارش:</b> {invoice.date}</div>
        <div><b>بازه ارسال:</b> {invoice.time}</div>
        <div><b>روش پرداخت:</b> {invoice.payment_method}</div>
        <div>
          <b>وضعیت پرداخت:</b>
          <span className={`invoice-paid${invoice.paid ? " paid" : " unpaid"}`}>
            {invoice.paid ? "پرداخت شد" : "پرداخت نشده"}
          </span>
        </div>
      </div>
      <div className="invoice-items-title">اقلام سفارش:</div>
      <div className="invoice-items-list">
        {invoice.items.map((item, i) => (
          <div key={i} className="invoice-item-row">
            <span>{item.name} × {item.qty}</span>
            <span>{(item.qty * item.price).toLocaleString()} تومان</span>
          </div>
        ))}
      </div>
      <div className="invoice-summary">
        <div className="summary-row">
          <span>هزینه ارسال</span>
          <span>{invoice.delivery_fee.toLocaleString()} تومان</span>
        </div>
        <div className="summary-row summary-discount">
          <span>تخفیف</span>
          <span>- {invoice.discount.toLocaleString()} تومان</span>
        </div>
        <div className="summary-row summary-final">
          <span>مبلغ کل</span>
          <span>{invoice.total.toLocaleString()} تومان</span>
        </div>
      </div>
      <div className="invoice-back">
        <Link href="/orders">بازگشت به سفارش‌ها</Link>
      </div>
      <style>{`
        .invoice-root {
          max-width: 650px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 27px 14px;
          font-family: Vazirmatn,sans-serif;
        }
        .invoice-title {
          font-size: 1.2rem;
          color: #3498db;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .invoice-header {
          font-size: 1rem;
          color: #444;
          margin-bottom: 13px;
          background: #f8fafc;
          border-radius: 13px;
          padding: 13px 14px;
        }
        .invoice-paid.paid { color: #27ae60; font-weight: bold;}
        .invoice-paid.unpaid { color: #c0392b; font-weight: bold;}
        .invoice-items-title {
          font-weight: bold;
          color: #213e32;
          margin-bottom: 9px;
          margin-top: 18px;
        }
        .invoice-items-list {
          margin-bottom: 12px;
        }
        .invoice-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          background: #f7f7f7;
          border-radius: 7px;
          margin-bottom: 6px;
          padding: 8px 12px;
        }
        .invoice-summary {
          background: #f8fafc;
          border-radius: 13px;
          padding: 14px 18px;
          box-shadow: 0 2px 10px #eee;
          margin-bottom: 0;
          margin-top: 11px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          margin-bottom: 7px;
        }
        .summary-discount { color: #e67e22;}
        .summary-final { font-weight: bold; color: #3498db;}
        .invoice-back {
          margin-top: 27px;
          text-align: center;
        }
        .invoice-back a {
          color: #3498db;
          font-weight: bold;
          text-decoration: none;
        }
        .invoice-back a:hover {
          text-decoration: underline;
        }
        @media (max-width: 700px) {
          .invoice-root { padding: 9px 2px;}
          .invoice-header, .invoice-summary { padding: 8px 5px;}
        }
      `}</style>
    </div>
  );
}
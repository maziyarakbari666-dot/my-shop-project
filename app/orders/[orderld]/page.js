'use client';

import Link from "next/link";
import { useParams } from "next/navigation";

// دمو: اطلاعات سفارش (در حالت واقعی باید از API یا سرور خوانده شود)
const mockOrder = {
  id: "ORD123456",
  date: "1404/06/10",
  time: "9 تا 10",
  total: 145000,
  status: "در حال آماده‌سازی",
  address: "تهران، خیابان ولیعصر، کوچه مهر، ساختمان 21، واحد 4",
  phone: "09121112233",
  items: [
    { name: "نان تست", qty: 2, price: 20000 },
    { name: "شیرینی مغزدار", qty: 1, price: 40000 },
    { name: "سبزی تازه", qty: 3, price: 15000 },
  ],
  delivery_fee: 35000,
  discount: 20000,
};

export default function OrderDetailsPage() {
  const params = useParams();
  // در حالت واقعی: بر اساس params.orderId اطلاعات را fetch کن!
  const order = mockOrder;

  return (
    <div className="order-root">
      <h2 className="order-title">جزئیات سفارش <b>{order.id}</b></h2>
      <div className="order-info">
        <div><b>وضعیت:</b> <span className={`order-status status-${order.status}`}>{order.status}</span></div>
        <div><b>تاریخ:</b> {order.date} | <b>بازه:</b> {order.time}</div>
        <div><b>آدرس:</b> {order.address}</div>
        <div><b>شماره تماس:</b> {order.phone}</div>
      </div>
      <div className="order-items-title">اقلام سفارش:</div>
      <div className="order-items-list">
        {order.items.map((item, i) => (
          <div key={i} className="order-item-row">
            <span>{item.name} × {item.qty}</span>
            <span>{(item.qty * item.price).toLocaleString()} تومان</span>
          </div>
        ))}
      </div>
      <div className="order-summary">
        <div className="summary-row">
          <span>هزینه ارسال</span>
          <span>{order.delivery_fee.toLocaleString()} تومان</span>
        </div>
        <div className="summary-row summary-discount">
          <span>تخفیف</span>
          <span>- {order.discount.toLocaleString()} تومان</span>
        </div>
        <div className="summary-row summary-final">
          <span>مبلغ کل</span>
          <span>{order.total.toLocaleString()} تومان</span>
        </div>
      </div>
      <div className="order-back">
        <Link href="/orders">بازگشت به سفارش‌ها</Link>
      </div>
      <style>{`
        .order-root {
          max-width: 600px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 27px 14px;
          font-family: Vazirmatn,sans-serif;
        }
        .order-title {
          font-size: 1.2rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .order-info {
          font-size: 1rem;
          color: #444;
          margin-bottom: 13px;
          background: #f8fafc;
          border-radius: 13px;
          padding: 13px 14px;
        }
        .order-status {
          font-weight: bold;
        }
        .status-در\\ حال\\ آماده‌سازی { color: #f39c12;}
        .status-ارسال\\ شده { color: #3498db;}
        .status-تحویل\\ داده\\ شد { color: #27ae60;}
        .order-items-title {
          font-weight: bold;
          color: #213e32;
          margin-bottom: 9px;
          margin-top: 18px;
        }
        .order-items-list {
          margin-bottom: 12px;
        }
        .order-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          background: #f7f7f7;
          border-radius: 7px;
          margin-bottom: 6px;
          padding: 8px 12px;
        }
        .order-summary {
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
        .summary-final { font-weight: bold; color: #27ae60;}
        .order-back {
          margin-top: 27px;
          text-align: center;
        }
        .order-back a {
          color: #27ae60;
          font-weight: bold;
          text-decoration: none;
        }
        .order-back a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .order-root { padding: 9px 2px;}
          .order-info, .order-summary { padding: 8px 5px;}
        }
      `}</style>
    </div>
  );
}
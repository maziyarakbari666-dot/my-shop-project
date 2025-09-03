'use client';

import Link from "next/link";

// دمو: سفارش‌ها
const mockOrders = [
  {
    id: "ORD123456",
    date: "1404/06/10",
    time: "9 تا 10",
    total: 145000,
    status: "در حال آماده‌سازی",
  },
  {
    id: "ORD123457",
    date: "1404/06/03",
    time: "13 تا 14",
    total: 84000,
    status: "ارسال شده",
  },
  {
    id: "ORD123458",
    date: "1404/05/28",
    time: "10 تا 11",
    total: 213000,
    status: "تحویل داده شد",
  },
];

export default function OrdersPage() {
  return (
    <div className="orders-root">
      <h2 className="orders-title">سفارش‌های من</h2>
      {mockOrders.length === 0 ? (
        <div className="orders-empty">هنوز سفارشی ثبت نکرده‌اید!</div>
      ) : (
        <div className="orders-list">
          {mockOrders.map(order => (
            <Link href={`/orders/${order.id}`} key={order.id} className="order-card">
              <div className="order-id">کد سفارش: <b>{order.id}</b></div>
              <div>
                <span className="order-date">{order.date}</span>
                {" | "}
                <span className="order-time">{order.time}</span>
              </div>
              <div className="order-total">مبلغ کل: {order.total.toLocaleString()} تومان</div>
              <div className={`order-status status-${order.status}`}>{order.status}</div>
            </Link>
          ))}
        </div>
      )}
      <style>{`
        .orders-root {
          max-width: 700px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 27px 14px;
          font-family: Vazirmatn,sans-serif;
        }
        .orders-title {
          font-size: 1.3rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 24px;
          text-align: center;
        }
        .orders-empty {
          color: #888;
          font-size: 1.1rem;
          text-align: center;
          margin: 43px 0;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .order-card {
          background: #f8fafc;
          border-radius: 14px;
          box-shadow: 0 2px 14px #eee;
          padding: 17px 13px;
          text-decoration: none;
          color: inherit;
          display: block;
          transition: box-shadow .2s, transform .2s;
          cursor: pointer;
        }
        .order-card:hover {
          box-shadow: 0 8px 28px #d1f5e5;
          transform: translateY(-2px) scale(1.03);
        }
        .order-id {
          font-size: 1.07rem;
          color: #4b8;
          margin-bottom: 7px;
        }
        .order-date, .order-time {
          color: #3498db;
          font-size: 1rem;
        }
        .order-total {
          color: #e67e22;
          font-weight: bold;
          margin-top: 7px;
          font-size: 1.05rem;
        }
        .order-status {
          font-size: 1rem;
          margin-top: 7px;
          font-weight: bold;
        }
        .status-در\\ حال\\ آماده‌سازی { color: #f39c12;}
        .status-ارسال\\ شده { color: #3498db;}
        .status-تحویل\\ داده\\ شد { color: #27ae60;}
        @media (max-width: 600px) {
          .orders-root { padding: 9px 2px;}
          .order-card { padding: 9px 5px;}
        }
      `}</style>
    </div>
  );
}
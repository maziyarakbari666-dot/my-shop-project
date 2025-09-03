'use client';

import Link from "next/link";
import { useParams } from "next/navigation";

// دمو: نمونه وضعیت پیگیری سفارش (در حالت واقعی باید از API خوانده شود)
const mockTracking = {
  steps: [
    { title: "ثبت سفارش", time: "1404/06/10، 09:05", done: true },
    { title: "در حال آماده‌سازی", time: "1404/06/10، 09:12", done: true },
    { title: "تحویل به پیک", time: "1404/06/10، 09:40", done: false },
    { title: "در حال ارسال", time: "", done: false },
    { title: "تحویل داده شد", time: "", done: false },
  ],
  currentLocation: "در انبار شعبه مرکزی",
  estimated: "تا 30 دقیقه دیگر",
};

export default function TrackOrderPage() {
  const params = useParams();
  // در حالت واقعی: اطلاعات را بر اساس params.orderId دریافت کن!
  const tracking = mockTracking;

  return (
    <div className="track-root">
      <h2 className="track-title">پیگیری سفارش <b>{params.orderId}</b></h2>
      <div className="track-info">
        <div><b>موقعیت فعلی:</b> {tracking.currentLocation}</div>
        <div><b>زمان تقریبی تحویل:</b> {tracking.estimated}</div>
      </div>
      <div className="track-steps">
        {tracking.steps.map((step, i) => (
          <div key={i} className={`track-step${step.done ? " done" : ""}`}> 
            <span className="step-dot" />
            <span className="step-title">{step.title}</span>
            {step.time && <span className="step-time">({step.time})</span>}
          </div>
        ))}
      </div>
      <div className="track-back">
        <Link href={`/orders/${params.orderId}`}>بازگشت به جزئیات سفارش</Link>
        <Link href="/orders">بازگشت به سفارش‌ها</Link>
      </div>
      <style>{`  
        .track-root {
          max-width: 500px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 27px 14px;
          font-family: Vazirmatn,sans-serif;
        }
        .track-title {
          font-size: 1.2rem;
          color: #2980b9;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .track-info {
          font-size: 1rem;
          color: #444;
          margin-bottom: 13px;
          background: #f8fafc;
          border-radius: 13px;
          padding: 13px 14px;
        }
        .track-steps {
          margin: 34px 0 18px 0;
          padding: 0 7px;
        }
        .track-step {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 1.08rem;
          color: #888;
        }
        .track-step.done {
          color: #27ae60;
          font-weight: bold;
        }
        .step-dot {
          display: inline-block;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          margin-left: 7px;
          margin-right: 11px;
          background: #eee;
        }
        .track-step.done .step-dot {
          background: #27ae60;
        }
        .step-title {
          flex: 1;
        }
        .step-time {
          color: #aaa;
          font-size: 0.93rem;
          margin-right: 9px;
        }
        .track-back {
          margin-top: 27px;
          text-align: center;
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        .track-back a {
          color: #2980b9;
          font-weight: bold;
          text-decoration: none;
        }
        .track-back a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .track-root { padding: 9px 2px; }
          .track-info { padding: 8px 5px;}
        }
      `}</style>
    </div>
  );
}
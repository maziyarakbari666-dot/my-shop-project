'use client';

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// دمو: تاریخچه وضعیت سفارش (در حالت واقعی باید از API یا سرور خوانده شود)
const mockTrack = {
  id: "ORD123456",
  status: "ارسال شده",
  steps: [
    { status: "در حال آماده‌سازی", date: "1404/06/10", time: "08:45" },
    { status: "آماده ارسال", date: "1404/06/10", time: "09:20" },
    { status: "ارسال شده", date: "1404/06/10", time: "09:35" },
  ],
  expected_delivery: {
    date: "1404/06/10",
    time: "9 تا 10"
  }
};

export default function TrackOrderPage() {
  const params = useParams();
  // در حالت واقعی: بر اساس params.orderId اطلاعات را fetch کن!
  const track = mockTrack;

  return (
    <div className="track-root">
      <h2 className="track-title">پیگیری سفارش <b>{track.id}</b></h2>
      <div className="track-status">
        <span>وضعیت فعلی:</span>
        <b className={`status-label status-${track.status.replace(/\s/g, "")}`}>{track.status}</b>
      </div>
      <div className="track-delivery">
        <span>تاریخ و بازه تحویل:</span>
        <b>{track.expected_delivery.date} - {track.expected_delivery.time}</b>
      </div>
      <div className="track-history-title">تاریخچه وضعیت سفارش:</div>
      <div className="track-history-list">
        {track.steps.map((step, i) => (
          <div key={i} className="track-step-row">
            <span className={`step-status status-${step.status.replace(/\s/g, "")}`}>{step.status}</span>
            <span>{step.date} - {step.time}</span>
          </div>
        ))}
      </div>
      <div className="track-back">
        <Link href="/orders">بازگشت به سفارش‌ها</Link>
      </div>
      <style>{`
        .track-root {
          max-width: 480px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 27px 14px;
          font-family: Vazirmatn,sans-serif;
        }
        .track-title {
          font-size: 1.2rem;
          color: #e67e22;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .track-status, .track-delivery {
          background: #f8fafc;
          border-radius: 13px;
          padding: 9px 14px;
          font-size: 1rem;
          color: #444;
          margin-bottom: 9px;
          display: flex;
          justify-content: space-between;
        }
        .status-label {
          font-weight: bold;
        }
        .status-درحالآماده‌سازی { color: #f39c12;}
        .status-آمادهارسال { color: #3498db;}
        .status-ارسالشده { color: #27ae60;}
        .status-تحویلدادهشد { color: #16a085;}
        .track-history-title {
          font-weight: bold;
          color: #213e32;
          margin-bottom: 9px;
          margin-top: 18px;
        }
        .track-history-list {
          margin-bottom: 12px;
        }
        .track-step-row {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          background: #f7f7f7;
          border-radius: 7px;
          margin-bottom: 6px;
          padding: 8px 12px;
        }
        .step-status.status-درحالآماده‌سازی { color: #f39c12;}
        .step-status.status-آمادهارسال { color: #3498db;}
        .step-status.status-ارسالشده { color: #27ae60;}
        .step-status.status-تحویلدادهشد { color: #16a085;}
        .track-back {
          margin-top: 27px;
          text-align: center;
        }
        .track-back a {
          color: #e67e22;
          font-weight: bold;
          text-decoration: none;
        }
        .track-back a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .track-root { padding: 9px 2px;}
          .track-status, .track-delivery { padding: 8px 5px;}
        }
      `}</style>
    </div>
  );
}
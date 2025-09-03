'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// دمو: جزئیات سفارش برای نمایش خلاصه
const mockOrder = {
  id: "ORD123456",
  date: "1404/06/10",
  items: [
    { name: "نان تست", qty: 2 },
    { name: "شیرینی مغزدار", qty: 1 },
    { name: "سبزی تازه", qty: 3 },
  ],
};

export default function OrderCommentPage() {
  const params = useParams();
  // در حالت واقعی: بر اساس params.orderId اطلاعات سفارش را fetch کن!
  const order = mockOrder;

  const [rate, setRate] = useState(5);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(true);
    // در حالت واقعی: ارسال نظر و امتیاز به API
  }

  return (
    <div className="comment-root">
      <h2 className="comment-title">ثبت نظر و امتیاز سفارش <b>{order.id}</b></h2>
      <div className="comment-order-info">
        <div><b>تاریخ سفارش:</b> {order.date}</div>
        <div><b>اقلام:</b> {order.items.map(i => `${i.name} × ${i.qty}`).join("، ")}</div>
      </div>
      {!success ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="rate-row">
            <label>امتیاز شما:</label>
            <div className="rate-stars">
              {[1,2,3,4,5].map(n => (
                <span
                  key={n}
                  className={n <= rate ? "star-filled" : "star-empty"}
                  onClick={() => setRate(n)}
                  style={{cursor:"pointer", fontSize:"24px"}}
                  title={`امتیاز ${n}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>متن نظر:</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="نظر خود را بنویسید..."
              required
            />
          </div>
          <button type="submit" className="comment-btn">ثبت نظر</button>
        </form>
      ) : (
        <div className="comment-success">
          ✅ نظر شما با موفقیت ثبت شد!
          <div style={{ marginTop: 22 }}>
            <Link href="/orders">بازگشت به سفارش‌ها</Link>
          </div>
        </div>
      )}
      <style>{`
        .comment-root {
          max-width: 430px;
          margin: 44px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .comment-title {
          font-weight: bold;
          font-size: 22px;
          color: #e67e22;
          margin-bottom: 20px;
          text-align: center;
        }
        .comment-order-info {
          background: #f8fafc;
          border-radius: 13px;
          padding: 11px 15px;
          font-size: 1rem;
          color: #444;
          margin-bottom: 15px;
        }
        .comment-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .rate-row label {
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 8px;
        }
        .rate-stars {
          display: flex;
          gap: 4px;
          margin-top: 3px;
        }
        .star-filled {
          color: #f39c12;
          text-shadow: 0 1px 2px #eee;
        }
        .star-empty {
          color: #ddd;
        }
        .form-row label {
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 8px;
        }
        .form-row textarea {
          width: 100%;
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid #eee;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
        }
        .comment-btn {
          background: linear-gradient(90deg,#e67e22 70%,#f7b731 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 0;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
          transition: background .2s;
          margin-top: 13px;
        }
        .comment-success {
          color: #27ae60;
          font-size: 21px;
          text-align: center;
          margin-top: 55px;
          font-family: Vazirmatn,sans-serif;
        }
        .comment-success a {
          color: #e67e22;
          font-weight: bold;
          text-decoration: none;
        }
        .comment-success a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .comment-root { padding: 11px 2px; }
          .comment-title { font-size: 18px; }
          .comment-btn { padding: 9px 0; font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
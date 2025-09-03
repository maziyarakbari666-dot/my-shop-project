'use client';

import React from "react";
import Link from "next/link";

// دمو: لیست نظرات ثبت‌شده کاربر
const mockComments = [
  {
    id: "ORD123456",
    date: "1404/06/10",
    rate: 5,
    comment: "همه چیز عالی بود! ممنون از کیفیت نان‌ها.",
    reply: "از اعتماد و خرید شما سپاسگزاریم! خوشحالیم رضایت داشتید.",
  },
  {
    id: "ORD123457",
    date: "1404/06/12",
    rate: 3,
    comment: "تحویل کمی دیر شد. لطفاً بازه را رعایت کنید.",
    reply: "پوزش بابت تاخیر! تلاش می‌کنیم سفارش‌های بعدی به‌موقع ارسال شود.",
  },
  {
    id: "ORD123458",
    date: "1404/06/15",
    rate: 4,
    comment: "شیرینی‌ها تازه و خوشمزه بودند.",
    reply: null,
  },
];

export default function CommentsListPage() {
  return (
    <div className="comments-root">
      <h2 className="comments-title">نظرات ثبت‌شده سفارش‌های شما</h2>
      {mockComments.length === 0 ? (
        <div className="comments-empty">
          هنوز نظری ثبت نکرده‌اید!
          <br />
          <Link href="/orders">
            <button className="comments-back-btn">بازگشت به سفارش‌ها</button>
          </Link>
        </div>
      ) : (
        <div className="comments-list">
          {mockComments.map(c => (
            <div key={c.id} className="comment-card">
              <div className="comment-info">
                <span className="comment-order-id">سفارش: <b>{c.id}</b></span>
                <span className="comment-date">{c.date}</span>
                <span className="comment-rate">{'★'.repeat(c.rate)}<span className="comment-rate-empty">{'★'.repeat(5-c.rate)}</span></span>
              </div>
              <div className="comment-user">
                <b>نظر شما:</b>
                <span>{c.comment}</span>
              </div>
              {c.reply && (
                <div className="comment-reply">
                  <b>پاسخ مدیریت:</b>
                  <span>{c.reply}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .comments-root {
          max-width: 650px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .comments-title {
          font-weight: bold;
          font-size: 22px;
          color: #e67e22;
          margin-bottom: 20px;
          text-align: center;
        }
        .comments-empty {
          text-align: center;
          color: #888;
          font-size: 18px;
          padding: 40px 0;
        }
        .comments-back-btn {
          background: #e67e22;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 13px 37px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 18px;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .comment-card {
          background: #f8fafc;
          border-radius: 13px;
          box-shadow: 0 2px 9px #eee;
          padding: 15px 13px;
        }
        .comment-info {
          display: flex;
          gap: 18px;
          align-items: center;
          margin-bottom: 7px;
          font-size: 15px;
        }
        .comment-order-id {
          color: #3498db;
        }
        .comment-date {
          color: #444;
        }
        .comment-rate {
          color: #f39c12;
          font-weight: bold;
          font-size: 19px;
        }
        .comment-rate-empty {
          color: #eee;
        }
        .comment-user {
          margin-bottom: 7px;
          font-size: 16px;
        }
        .comment-user b {
          color: #27ae60;
          margin-left: 5px;
        }
        .comment-reply {
          background: #fff9e8;
          border-radius: 7px;
          padding: 9px 10px;
          font-size: 15px;
          color: #e67e22;
          margin-top: 4px;
        }
        .comment-reply b {
          margin-left: 5px;
        }
        @media (max-width: 700px) {
          .comments-root { padding: 11px 2px;}
          .comment-card { padding: 9px 5px;}
        }
      `}</style>
    </div>
  );
}
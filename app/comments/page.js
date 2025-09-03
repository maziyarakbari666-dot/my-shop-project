'use client';

import React from "react";

// دمو: لیست نظرات عمومی کاربران
const mockPublicComments = [
  {
    user: "علی",
    rate: 5,
    comment: "نان تست فوق‌العاده بود. تازه و خوشمزه!",
    date: "1404/06/14",
    product: "نان تست",
  },
  {
    user: "سارا",
    rate: 4,
    comment: "شیرینی مغزدار خیلی خوب بود اما بسته‌بندی می‌توانست بهتر باشد.",
    date: "1404/06/15",
    product: "شیرینی مغزدار",
  },
  {
    user: "محسن",
    rate: 3,
    comment: "ارسال کمی دیر انجام شد، اما کیفیت سبزی عالی بود.",
    date: "1404/06/16",
    product: "سبزی تازه",
  },
];

export default function PublicCommentsPage() {
  return (
    <div className="public-comments-root">
      <h2 className="public-comments-title">نظرات کاربران</h2>
      {mockPublicComments.length === 0 ? (
        <div className="public-comments-empty">
          هنوز نظری توسط کاربران ثبت نشده است!
        </div>
      ) : (
        <div className="public-comments-list">
          {mockPublicComments.map((c, i) => (
            <div key={i} className="public-comment-card">
              <div className="public-comment-info">
                <span className="public-comment-user">کاربر: <b>{c.user}</b></span>
                <span className="public-comment-date">{c.date}</span>
                <span className="public-comment-rate">{'★'.repeat(c.rate)}<span className="public-comment-rate-empty">{'★'.repeat(5-c.rate)}</span></span>
              </div>
              <div className="public-comment-product">
                <b>محصول:</b> {c.product}
              </div>
              <div className="public-comment-text">
                {c.comment}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .public-comments-root {
          max-width: 650px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .public-comments-title {
          font-weight: bold;
          font-size: 22px;
          color: #27ae60;
          margin-bottom: 20px;
          text-align: center;
        }
        .public-comments-empty {
          text-align: center;
          color: #888;
          font-size: 18px;
          padding: 40px 0;
        }
        .public-comments-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .public-comment-card {
          background: #f8fafc;
          border-radius: 13px;
          box-shadow: 0 2px 9px #eee;
          padding: 15px 13px;
        }
        .public-comment-info {
          display: flex;
          gap: 18px;
          align-items: center;
          margin-bottom: 7px;
          font-size: 15px;
        }
        .public-comment-user {
          color: #3498db;
        }
        .public-comment-date {
          color: #444;
        }
        .public-comment-rate {
          color: #f39c12;
          font-weight: bold;
          font-size: 19px;
        }
        .public-comment-rate-empty {
          color: #eee;
        }
        .public-comment-product {
          margin-bottom: 7px;
          font-size: 15px;
          color: #27ae60;
        }
        .public-comment-product b {
          margin-left: 4px;
        }
        .public-comment-text {
          font-size: 16px;
          margin-top: 4px;
        }
        @media (max-width: 700px) {
          .public-comments-root { padding: 11px 2px;}
          .public-comment-card { padding: 9px 5px;}
        }
      `}</style>
    </div>
  );
}
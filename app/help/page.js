'use client';

import React, { useState } from "react";

const faqList = [
  {
    question: "چگونه سفارش ثبت کنم؟",
    answer: "برای ثبت سفارش ابتدا وارد سایت شوید، محصول مورد نظر را به سبد خرید اضافه کنید و سپس فرایند پرداخت را انجام دهید."
  },
  {
    question: "چطور خرید اعتباری (BNPL) داشته باشم؟",
    answer: "در صفحه محصول گزینه خرید اعتباری را انتخاب کنید و طبق مراحل نمایش داده شده به صورت اقساطی خرید کنید."
  },
  {
    question: "زمان ارسال سفارش چقدر است؟",
    answer: "معمولاً سفارش‌ها بین ۱ تا ۳ روز کاری به دست شما می‌رسد."
  },
  {
    question: "چطور آدرس جدید ثبت کنم؟",
    answer: "در پنل کاربری بخش آدرس‌ها می‌توانید آدرس جدید خود را وارد و ثبت کنید."
  },
  {
    question: "در صورت مشکل یا سوال چطور با پشتیبانی تماس بگیرم؟",
    answer: "از طریق صفحه تماس با ما یا شماره تلفن 021-12345678 با پشتیبانی ارتباط بگیرید."
  }
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="faq-root">
      <h2 className="faq-title">راهنمای خرید و سوالات متداول</h2>
      <div className="faq-list">
        {faqList.map((faq, idx) => (
          <div key={idx} className="faq-item">
            <button className="faq-question" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
              {faq.question}
              <span className="faq-toggle">{openIdx === idx ? "−" : "+"}</span>
            </button>
            {openIdx === idx && (
              <div className="faq-answer">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`
        .faq-root {
          max-width: 650px;
          margin: 40px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 32px 16px;
          font-family: Vazirmatn,sans-serif;
        }
        .faq-title {
          font-size: 1.25rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .faq-list {
          margin-top: 15px;
        }
        .faq-item {
          margin-bottom: 13px;
          border-radius: 10px;
          background: #f8fafc;
        }
        .faq-question {
          width: 100%;
          text-align: right;
          background: none;
          border: none;
          font-size: 1.08rem;
          font-weight: bold;
          color: #444;
          padding: 13px 8px;
          border-radius: 10px;
          cursor: pointer;
          transition: background .2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .faq-question:hover {
          background: #eafaf1;
          color: #27ae60;
        }
        .faq-toggle {
          font-size: 1.4rem;
          color: #27ae60;
          margin-right: 8px;
          margin-left: 6px;
        }
        .faq-answer {
          background: #eafaf1;
          padding: 11px 17px;
          border-radius: 0 0 10px 10px;
          color: #333;
          font-size: 1rem;
        }
        @media (max-width: 600px) {
          .faq-root { padding: 12px 2px; }
          .faq-title { font-size: 1.08rem; }
          .faq-question { font-size: 1rem; padding: 7px 2px;}
          .faq-answer { font-size: 0.95rem; padding: 7px 7px;}
        }
      `}</style>
    </div>
  );
}
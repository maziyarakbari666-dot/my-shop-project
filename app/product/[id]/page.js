'use client';

import React from "react";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext";

// داده دمو محصولات با عکس آنلاین
const products = [
  {
    id: "1",
    name: "نان تست تازه",
    category: "نان",
    price: 20000,
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1519864600265-abb23847ef5c?auto=format&fit=crop&w=400&q=80"
    ],
    description: "نان تست تازه و سنتی، مناسب برای صبحانه و ساندویچ.",
    bnpl: { enabled: true, installmentCount: 4, installmentAmount: 5000 }
  },
  {
    id: "2",
    name: "شیرینی خامه‌ای",
    category: "شیرینی",
    price: 50000,
    stock: 8,
    images: [
      "https://images.unsplash.com/photo-1464306076886-debede14d7b1?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1519864600265-abb23847ef5c?auto=format&fit=crop&w=400&q=80"
    ],
    description: "شیرینی خامه‌ای با بهترین مواد اولیه و طعم عالی.",
    bnpl: { enabled: false }
  }
  // ... سایر محصولات
];

// دمو نظرات
const comments = {
  "1": [
    { user: "سمیرا", text: "خیلی تازه و خوشمزه بود!", date: "1402/05/11" },
    { user: "مهدی", text: "برای صبحونه عالیه.", date: "1402/05/09" }
  ],
  "2": [
    { user: "فرزانه", text: "طعمش بی‌نظیر بود.", date: "1402/05/12" }
  ]
};

export default function ProductPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const product = products.find(p => p.id === params.id);

  if (!product) {
    return (
      <div className="prod-root">
        محصول موردنظر پیدا نشد.
        <style>{`
          .prod-root { padding:80px 0; text-align:center; font-family:Vazirmatn,sans-serif; font-size:22px;}
        `}</style>
      </div>
    );
  }

  return (
    <div className="prod-root">
      {/* تصاویر محصول */}
      <div className="prod-img-list">
        {product.images.map((img, idx) => (
          <img key={idx} src={img} alt={product.name}
            className="prod-img"
          />
        ))}
      </div>
      {/* جزئیات محصول */}
      <h2 className="prod-title">{product.name}</h2>
      <div className="prod-cat">دسته‌بندی: {product.category}</div>
      <div className="prod-desc">{product.description}</div>
      <div className="prod-price-row">
        <span className="prod-price">{product.price.toLocaleString()} تومان</span>
        <span className={`prod-stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
          {product.stock > 0 ? `موجود (${product.stock} عدد)` : "ناموجود"}
        </span>
      </div>
      {/* ابزارک BNPL */}
      {product.bnpl?.enabled && (
        <div className="prod-bnpl">
          خرید اعتباری: این محصول را با پرداخت
          {" "}
          {product.bnpl.installmentCount}
          {" "}
          قسط {product.bnpl.installmentAmount.toLocaleString()} تومان تهیه کنید!
        </div>
      )}
      {/* افزودن به سبد خرید */}
      <button
        className="prod-btn"
        disabled={product.stock === 0}
        onClick={() => addToCart(product)}
      >
        افزودن به سبد خرید
      </button>
      {/* نظرات کاربران */}
      <div className="prod-comments">
        <h3 className="prod-comments-title">نظرات کاربران</h3>
        {(comments[product.id]?.length > 0) ? (
          comments[product.id].map((c, i) => (
            <div key={i} className="prod-comment">
              <div className="prod-comment-user">{c.user}</div>
              <div className="prod-comment-text">{c.text}</div>
              <div className="prod-comment-date">{c.date}</div>
            </div>
          ))
        ) : (
          <div className="prod-comment-empty">هنوز نظری ثبت نشده است.</div>
        )}
      </div>
      <style>{`
        .prod-root {
          font-family: Vazirmatn,sans-serif;
          max-width: 780px;
          margin: 32px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          padding: 28px 16px;
        }
        .prod-img-list {
          display: flex;
          gap: 14px;
          justify-content: center;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .prod-img {
          width: 140px;
          height: 140px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid #ececec;
          box-shadow: 0 2px 8px #eee;
          background: #fafafa;
        }
        .prod-title {
          font-weight: bold;
          font-size: 26px;
          color: #27ae60;
          margin-bottom: 6px;
          text-align: center;
        }
        .prod-cat {
          color: #888; font-size: 16px; margin-bottom: 8px; text-align: center;
        }
        .prod-desc { font-size: 17px; margin-bottom: 14px; text-align: center;}
        .prod-price-row {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 18px;
          justify-content: center;
        }
        .prod-price {
          font-weight: bold;
          font-size: 22px;
          color: #e67e22;
        }
        .prod-stock.in-stock { font-size: 15px; color: #27ae60; font-weight: bold;}
        .prod-stock.out-stock { font-size: 15px; color: #c0392b; font-weight: bold;}
        .prod-bnpl {
          background: #f9f6e7;
          border-radius: 9px;
          padding: 12px 16px;
          margin-bottom: 20px;
          color: #c0392b;
          font-weight: bold;
          font-size: 17px;
          text-align: center;
        }
        .prod-btn {
          padding: 11px 38px;
          background: linear-gradient(90deg,#27ae60 70%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 11px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
          margin-bottom: 22px;
          transition: background .2s;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .prod-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .prod-comments {
          margin-top: 18px;
          border-top: 1px solid #f3f3f3;
          padding-top: 14px;
        }
        .prod-comments-title {
          font-weight: bold;
          font-size: 19px;
          margin-bottom: 10px;
          color: #27ae60;
          text-align: center;
        }
        .prod-comment {
          background: #fafafa;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 10px;
          box-shadow: 0 1px 6px #eee;
        }
        .prod-comment-user {
          font-weight: bold; color: #222;
          margin-bottom: 4px;
        }
        .prod-comment-text { font-size: 15px; margin-top: 2px;}
        .prod-comment-date { font-size: 13px; color: #888; margin-top: 2px;}
        .prod-comment-empty { color: #888; font-size: 16px; text-align: center;}
        @media (max-width: 600px) {
          .prod-root { padding: 8px 2px;}
          .prod-title { font-size: 19px;}
          .prod-img { width: 100px; height: 100px;}
        }
      `}</style>
    </div>
  );
}
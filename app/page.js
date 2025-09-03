'use client';

import React, { useState } from "react";
import { useCart } from "./context/CartContext";

// عکس‌های محصولات از Unsplash (رایگان و بی‌دردسر)
const categories = [
  {
    id: "bread",
    title: "نان",
    products: [
      {
        id: "1",
        name: "نان تست تازه",
        desc: "نان تست سنتی با کیفیت عالی و عطر دلپذیر.",
        price: 20000,
        stock: 15,
        image: "https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "2",
        name: "نان جو سبوس‌دار",
        desc: "نان جو سبوس‌دار، مناسب رژیم و سلامت.",
        price: 25000,
        stock: 12,
        image: "https://images.unsplash.com/photo-1519864600265-abb23847ef5c?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    id: "sweet",
    title: "شیرینی",
    products: [
      {
        id: "3",
        name: "شیرینی خامه‌ای",
        desc: "شیرینی خامه‌ای تازه و خوشمزه با طعم عالی.",
        price: 50000,
        stock: 8,
        image: "https://images.unsplash.com/photo-1519864600265-abb23847ef5c?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "4",
        name: "شیرینی نارگیلی",
        desc: "شیرینی نارگیلی نرم و معطر.",
        price: 32000,
        stock: 10,
        image: "https://images.unsplash.com/photo-1464306076886-debede14d7b1?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    id: "veggie",
    title: "سبزیجات",
    products: [
      {
        id: "5",
        name: "سبزیجات آماده",
        desc: "سبزیجات تازه و پاک شده برای آشپزی و سالاد.",
        price: 30000,
        stock: 22,
        image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "6",
        name: "ریحان تازه",
        desc: "ریحان تازه و خوش‌عطر مناسب غذا و سالاد.",
        price: 12000,
        stock: 18,
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80"
      }
    ]
  }
];

// بنر فروشگاه با عکس حرفه‌ای Unsplash
const BANNER_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

export default function HomePage() {
  const { addToCart } = useCart();
  const [activeCat, setActiveCat] = useState(categories[0].id);

  const activeProducts = categories.find(c => c.id === activeCat)?.products || [];

  return (
    <div className="main-root">
      {/* بنر جذاب و شعار */}
      <div className="banner-box">
        <img src={BANNER_IMAGE} alt="بنر فروشگاه" className="banner-img" />
        <div className="banner-text">
          <h1 className="banner-title">فروشگاه آنلاین مواد غذایی و سوپرمارکت</h1>
          <p className="banner-desc">
            <span className="highlight">تازه‌ترین محصولات، ارسال سریع، پرداخت اعتباری BNPL</span>
            <br />
            <span style={{color:"#27ae60"}}>خریدی راحت و مطمئن با قیمت مناسب و تضمین کیفیت</span>
          </p>
        </div>
      </div>

      {/* دسته‌بندی‌ها */}
      <div className="categories-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-tab ${activeCat === cat.id ? "active" : ""}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* محصولات دسته انتخاب شده */}
      <div className="products-section">
        <h2 className="products-title">{categories.find(c => c.id === activeCat)?.title}</h2>
        <div className="products-list">
          {activeProducts.length === 0 ? (
            <div className="empty-products">هنوز محصولی در این دسته نیست.</div>
          ) : (
            activeProducts.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-img-wrap">
                  <img src={p.image} alt={p.name} className="product-img" />
                  {p.stock === 0 && <span className="img-badge">ناموجود</span>}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-desc">{p.desc}</p>
                  <div className="product-bottom">
                    <span className="product-price">
                      <span className="icon-price">💵</span>
                      {p.price.toLocaleString()} تومان
                    </span>
                    <span className={`product-stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                      {p.stock > 0 ? `موجود (${p.stock})` : "ناموجود"}
                    </span>
                  </div>
                  <button
                    className="add-cart-btn"
                    disabled={p.stock === 0}
                    onClick={() => addToCart({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      images: [p.image],
                      quantity: 1,
                    })}
                  >
                    <span className="icon-cart">🛒</span> خرید سریع
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* استایل ویژه و ریسپانسیو */}
      <style>{`
        .main-root {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 0 36px 0;
          font-family: Vazirmatn,sans-serif;
          background: #f8fafc;
        }
        .banner-box {
          background: linear-gradient(90deg,#eafaf1 60%,#f8fafc 100%);
          border-radius: 24px;
          box-shadow: 0 8px 38px #e2e6ea;
          margin: 30px 0 36px 0;
          padding: 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .banner-img {
          width: 100%;
          max-width: 480px;
          border-radius: 24px;
          box-shadow: 0 2px 18px #eee;
          margin: 18px 0 18px 0;
          object-fit: cover;
        }
        .banner-text {
          flex: 1;
          text-align: center;
          padding: 20px 18px;
        }
        .banner-title {
          font-size: 2.13rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 11px;
          letter-spacing: 1px;
        }
        .banner-desc {
          font-size: 1.1rem;
          color: #444;
          margin-bottom: 0;
        }
        .highlight {
          background: #e67e22;
          color: #fff;
          padding: 4px 11px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 1.09rem;
        }
        .categories-tabs {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-bottom: 25px;
        }
        .cat-tab {
          background: #fff;
          color: #27ae60;
          border: 2px solid #27ae60;
          border-radius: 14px;
          padding: 11px 34px;
          font-size: 1.08rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 1px 6px #eee;
          transition: background .2s, color .2s, border-color .2s;
        }
        .cat-tab.active {
          background: #27ae60;
          color: #fff;
          border-color: #27ae60;
        }
        .products-section {
          margin-top: 10px;
        }
        .products-title {
          font-size: 1.35rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 21px;
          text-align: center;
        }
        .products-list {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          justify-content: center;
        }
        .product-card {
          background: #fff;
          border-radius: 17px;
          box-shadow: 0 2px 16px #eee;
          width: 330px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 19px 13px 18px 13px;
          transition: box-shadow .2s;
          position: relative;
        }
        .product-card:hover {
          box-shadow: 0 8px 28px #d1f5e5;
        }
        .product-img-wrap {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .product-img {
          width: 90%;
          max-width: 175px;
          border-radius: 18px;
          object-fit: cover;
          margin-bottom: 14px;
          box-shadow: 0 1px 10px #e1e1e1;
          background: #fafafa;
        }
        .img-badge {
          position: absolute;
          right: 16px;
          top: 12px;
          background: #c0392b;
          color: #fff;
          font-size: 1rem;
          padding: 4px 13px;
          border-radius: 11px;
          font-weight: bold;
        }
        .product-info {
          width: 100%;
        }
        .product-name {
          font-size: 1.13rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 4px;
          text-align: center;
        }
        .product-desc {
          font-size: 15px;
          color: #555;
          margin-bottom: 10px;
          text-align: center;
        }
        .product-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 15px;
        }
        .icon-price { font-size: 1.17rem; margin-left: 3px; }
        .product-price {
          color: #e67e22;
          font-weight: bold;
        }
        .product-stock.in-stock {
          color: #27ae60;
          font-weight: bold;
        }
        .product-stock.out-stock {
          color: #c0392b;
          font-weight: bold;
        }
        .add-cart-btn {
          background: linear-gradient(90deg,#27ae60 60%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 13px;
          padding: 13px 0;
          width: 100%;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 1px 6px #e2e2e2;
          margin-top: 4px;
          transition: background .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .add-cart-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .add-cart-btn:hover:not(:disabled) {
          background: linear-gradient(90deg,#219150 60%,#43e97b 100%);
        }
        .icon-cart { font-size: 1.3rem; }

        .empty-products {
          color: #888;
          font-size: 1.1rem;
          margin-top: 18px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .banner-box {
            flex-direction: column;
            padding: 8px 7px 11px 7px;
            margin: 13px 0 20px 0;
          }
          .banner-img {
            margin: 8px auto 8px auto;
            max-width: 99vw;
          }
          .banner-title { font-size: 1.3rem;}
          .products-list { gap: 16px;}
          .product-card { width: 250px; padding: 13px 6px 13px 6px;}
          .product-img { max-width: 110px;}
        }
        @media (max-width: 600px) {
          .main-root { padding: 0 0 20px 0;}
          .banner-title { font-size: 1.1rem;}
          .products-title { font-size: 1rem;}
          .categories-tabs { gap: 7px;}
          .cat-tab { padding: 7px 12px; font-size: 0.97rem;}
          .products-list { gap: 7px;}
          .product-card { width: 97vw; max-width: 350px;}
        }
      `}</style>
    </div>
  );
}
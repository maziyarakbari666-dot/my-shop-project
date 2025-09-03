'use client';

import Link from "next/link";

const categories = [
  {
    id: "bread",
    name: "نان",
    image: "https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "sweet",
    name: "شیرینی",
    image: "https://images.unsplash.com/photo-1464306076886-debede14d7b1?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "vegetable",
    name: "سبزیجات",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80"
  }
  // ... دسته‌های دیگر
];

export default function CategoriesPage() {
  return (
    <div className="cat-root">
      <h2 className="cat-title">دسته‌بندی‌های فروشگاه</h2>
      <div className="cat-list">
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/categories/${cat.id}`}
            className="cat-card"
          >
            <img src={cat.image} alt={cat.name} className="cat-img" />
            <div className="cat-name">{cat.name}</div>
          </Link>
        ))}
      </div>
      <style>{`
        .cat-root {
          max-width: 750px;
          margin: 42px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 26px 13px;
          font-family: Vazirmatn,sans-serif;
        }
        .cat-title {
          font-size: 1.3rem; color: #27ae60; font-weight:bold; margin-bottom:29px; text-align:center;
        }
        .cat-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 24px;
          align-items: stretch;
        }
        .cat-card {
          background: #f8fafc;
          padding: 18px 11px 12px 11px;
          border-radius: 16px;
          box-shadow: 0 2px 14px #eee;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: box-shadow .2s, transform .2s;
          cursor: pointer;
        }
        .cat-card:hover {
          box-shadow: 0 6px 22px #d1f5e5;
          transform: translateY(-3px) scale(1.03);
        }
        .cat-img {
          width: 110px;
          height: 110px;
          border-radius: 13px;
          object-fit: cover;
          background: #fafafa;
          margin-bottom: 12px;
        }
        .cat-name {
          color: #213e32; font-weight: bold; font-size: 1.12rem; margin-bottom: 0px;
        }
        @media (max-width: 700px) {
          .cat-list { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
          .cat-img { width: 70px; height: 70px;}
        }
      `}</style>
    </div>
  );
}
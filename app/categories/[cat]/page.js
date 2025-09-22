'use client';

import { useParams } from "next/navigation";
import Link from "next/link";

// دمو محصولات با دسته‌بندی
const products = [
  {
    id: "1",
    name: "نان تست تازه",
    category: "bread",
    price: 20000,
    image: "https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=400&q=80",
    stock: 15
  },
  {
    id: "2",
    name: "شیرینی خامه‌ای",
    category: "sweet",
    price: 50000,
    image: "https://images.unsplash.com/photo-1464306076886-debede14d7b1?auto=format&fit=crop&w=400&q=80",
    stock: 8
  },
  {
    id: "3",
    name: "سبزیجات آماده",
    category: "vegetable",
    price: 30000,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    stock: 20
  }
  // ... محصولات بیشتر
];

const categories = {
  bread: "نان",
  sweet: "شیرینی",
  vegetable: "سبزیجات"
  // ... دسته‌های بیشتر
};

export default function CategoryProductsPage() {
  const params = useParams();
  const catId = params.cat;
  const catName = categories[catId] || "نامشخص";
  const filtered = products.filter(p => p.category === catId);

  return (
    <div className="catprod-root">
      <h2 className="catprod-title">محصولات دسته &quot;{catName}&quot;</h2>
      {filtered.length === 0 ? (
        <div className="catprod-empty">در این دسته‌بندی محصولی وجود ندارد.</div>
      ) : (
        <div className="catprod-grid">
          {filtered.map(product => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="catprod-card"
            >
              <img src={product.image} alt={product.name} className="catprod-img" />
              <div className="catprod-info">
                <div className="catprod-name">{product.name}</div>
                <div className="catprod-price">{product.price.toLocaleString()} تومان</div>
                <div className={`catprod-stock ${product.stock > 0 ? "in-stock" : "out-stock"}`}>
                  {product.stock > 0 ? `موجود (${product.stock})` : "ناموجود"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <style>{`
        .catprod-root {
          max-width: 910px;
          margin: 40px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 26px 13px;
          font-family: Vazirmatn,sans-serif;
        }
        .catprod-title {
          font-size: 1.2rem; color: #27ae60; font-weight:bold; margin-bottom:24px; text-align:center;
        }
        .catprod-empty {
          color: #b0b0b0;
          font-size: 1.1rem;
          text-align: center;
          margin: 43px 0;
        }
        .catprod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 26px;
          align-items: stretch;
        }
        .catprod-card {
          background: #f8fafc;
          padding: 17px 11px 13px 11px;
          border-radius: 16px;
          box-shadow: 0 2px 14px #eee;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: box-shadow .2s, transform .2s;
        }
        .catprod-card:hover {
          box-shadow: 0 6px 22px #d1f5e5;
          transform: translateY(-4px) scale(1.02);
        }
        .catprod-img {
          width: 130px;
          height: 130px;
          border-radius: 13px;
          object-fit: cover;
          background: #fafafa;
          margin-bottom: 11px;
        }
        .catprod-info {
          text-align: center;
        }
        .catprod-name {
          color: #213e32; font-weight: bold; font-size: 1.08rem; margin-bottom: 6px;
        }
        .catprod-price {
          color: #e67e22; font-weight: bold; font-size: 1.05rem; margin-bottom: 7px;
        }
        .catprod-stock.in-stock { color: #27ae60; font-weight: bold;}
        .catprod-stock.out-stock { color: #c0392b; font-weight: bold;}
        @media (max-width: 700px) {
          .catprod-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
          .catprod-img { width: 80px; height: 80px;}
        }
      `}</style>
    </div>
  );
}
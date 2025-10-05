'use client';

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import Link from "next/link";

const products = [
  {
    id: "1",
    name: "نان تست تازه",
    category: "نان",
    price: 20000,
    image: "https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=400&q=80",
    stock: 15,
    description: "نان تست تازه با کیفیت عالی، مناسب صبحانه و عصرانه.",
  },
  {
    id: "2",
    name: "شیرینی خامه‌ای",
    category: "شیرینی",
    price: 50000,
    image: "https://images.unsplash.com/photo-1464306076886-debede14d7b1?auto=format&fit=crop&w=400&q=80",
    stock: 0,
    description: "شیرینی خامه‌ای تازه و خوش‌طعم، مناسب پذیرایی.",
  },
  {
    id: "3",
    name: "سبزیجات آماده",
    category: "سبزیجات",
    price: 30000,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    stock: 20,
    description: "سبزیجات شسته‌شده و خردشده، آماده مصرف.",
  }
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [serverProducts, setServerProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(()=> Array.from(new Set(products.map(p => p.category))), []);

  useEffect(()=>{
    const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const initialQ = q.get('q') || '';
    setSearch(initialQ);
  }, []);

  useEffect(()=>{
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true); setError("");
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (catFilter) params.set('category', catFilter);
        params.set('page', '1'); params.set('pageSize', '48');
        const r = await fetch(`${API}/api/products/search?${params.toString()}`, { signal: controller.signal, cache: 'no-store' });
        const d = await r.json();
        if (r.ok && d?.products) setServerProducts(d.products);
        else setError(d?.error || 'خطا در دریافت محصولات');
      } catch(e) {
        if (e.name !== 'AbortError') setError('خطا در ارتباط با سرور');
      } finally { setLoading(false); }
    }
    load();
    return ()=> controller.abort();
  }, [search, catFilter]);

  const filteredProducts = serverProducts.length ? serverProducts : products.filter(product =>
    (search ? product.name.includes(search) : true) &&
    (catFilter === "" || product.category === catFilter)
  );

  return (
    <div className="prodlist-root">
      <h2 className="prodlist-title">لیست محصولات فروشگاه</h2>
      <div className="prodlist-toolbar">
        <input
          type="text"
          placeholder="جستجو بر اساس نام محصول..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="prodlist-search"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="prodlist-catfilter"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="prodlist-count">تعداد محصولات: <b>{filteredProducts.length}</b></div>
      </div>
      {loading && <div style={{textAlign:'center', color:'#888'}}>در حال بارگذاری...</div>}
      {error && <div style={{textAlign:'center', color:'#c0392b'}}>{error}</div>}
      <div className="prodlist-grid">
        {filteredProducts.map(product => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className={`prodlist-card${product.stock === 0 ? " out-stock-card" : ""}`}
            tabIndex={product.stock === 0 ? -1 : 0}
          >
            <img src={product.image} alt={product.name} className="prodlist-img" />
            <div className="prodlist-info">
              <div className="prodlist-name">{product.name}</div>
              <div className="prodlist-cat">{product.category}</div>
              <div className="prodlist-price">{product.price.toLocaleString()} تومان</div>
              <div className={`prodlist-stock ${product.stock > 0 ? "in-stock" : "out-stock"}`}>
                {product.stock > 0 ? `موجود (${product.stock})` : "ناموجود"}
              </div>
              <div className="prodlist-desc">{product.description}</div>
              <button
                className="prodlist-cartbtn"
                disabled={product.stock === 0}
                onClick={e => {
                  e.preventDefault();
                  alert("افزودن به سبد خرید (دمو)");
                }}
              >
                افزودن به سبد خرید
              </button>
            </div>
          </Link>
        ))}
        {filteredProducts.length === 0 && (
          <div className="prodlist-noproduct">محصولی یافت نشد!</div>
        )}
      </div>
      <style>{`
        .prodlist-root {max-width: 950px; margin: 40px auto; background: #fff; border-radius: 22px; box-shadow: 0 2px 18px #eee; padding: 26px 13px; font-family: Vazirmatn,sans-serif;}
        .prodlist-title {font-size: 1.3rem; color: #27ae60; font-weight:bold; margin-bottom:18px; text-align:center;}
        .prodlist-toolbar {display:flex; gap:15px; margin-bottom:27px; flex-wrap:wrap; align-items:center; justify-content:center;}
        .prodlist-search {font-size:1rem;padding:7px 11px;border-radius:7px;border:1px solid #eee;min-width:170px;}
        .prodlist-catfilter {font-size:1rem;padding:7px 11px;border-radius:7px;border:1px solid #eee;}
        .prodlist-count {font-size: 1rem; color: #888;}
        .prodlist-grid {display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 28px; align-items: stretch;}
        .prodlist-card {background: #f8fafc; padding: 17px 11px 13px 11px; border-radius: 16px; box-shadow: 0 2px 14px #eee; text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; transition: box-shadow .2s, transform .2s;}
        .prodlist-card:hover {box-shadow: 0 6px 22px #d1f5e5; transform: translateY(-4px) scale(1.02);}
        .prodlist-img {width: 140px; height: 140px; border-radius: 13px; object-fit: cover; background: #fafafa; margin-bottom: 11px;}
        .prodlist-info {text-align: center; width:100%;}
        .prodlist-name {color: #213e32; font-weight: bold; font-size: 1.08rem; margin-bottom: 6px;}
        .prodlist-cat {color: #888; font-size: 0.95rem; margin-bottom: 5px;}
        .prodlist-price {color: #e67e22; font-weight: bold; font-size: 1.05rem; margin-bottom: 7px;}
        .prodlist-stock.in-stock { color: #27ae60; font-weight: bold;}
        .prodlist-stock.out-stock { color: #c0392b; font-weight: bold;}
        .prodlist-desc {font-size:0.97rem;color:#555;margin-bottom:7px;}
        .prodlist-cartbtn {background: #27ae60; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-size: 0.95rem; font-weight: bold; margin-top: 7px; cursor: pointer; box-shadow: 0 2px 6px #eee; transition: background .2s;}
        .prodlist-cartbtn:disabled {opacity: 0.6; cursor: not-allowed;}
        .out-stock-card {opacity:0.7; pointer-events:none; box-shadow:none;}
        .prodlist-noproduct {grid-column: 1/-1; color:#c0392b; font-size:1.1rem; text-align:center; margin:34px 0;}
        @media (max-width: 700px) {.prodlist-grid { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); } .prodlist-img { width: 100px; height: 100px;}}
      `}</style>
    </div>
  );
}
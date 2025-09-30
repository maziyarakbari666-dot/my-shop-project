'use client';

import React, { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import DeliveryTimeSelector from "../../components/DeliveryTimeSelector";

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

const BASE_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function normalizeProduct(p) {
  if (!p) return p;
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.image ? [p.image] : []);
  const categoryName = typeof p.category === 'string' ? p.category : (p.category?.name || "");
  const id = p._id || p.id;
  const price = Number(p.price) || 0;
  const stock = typeof p.stock === 'number' ? p.stock : (p.stock ? Number(p.stock) : 0);
  const bnpl = p.bnpl || (price > 0 ? { enabled: true, installmentCount: 4, installmentAmount: Math.ceil(price / 4) } : { enabled: false });
  return { ...p, id, _id: id, images, image: images[0], category: categoryName, price, stock, bnpl };
}

export default function ProductPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(() => {
    const demo = products.find(p => p.id === params.id);
    return demo ? normalizeProduct(demo) : null;
  });
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);
  const touchActive = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDateISO, setSelectedDateISO] = useState(() => new Date().toISOString());
  const [selectedSlot, setSelectedSlot] = useState("");
  const todayISO = useMemo(()=> new Date().toISOString(), []);

  useEffect(() => {
    // fetch from backend if available
    fetch(`${BASE_API}/api/products/${params.id}`).then(r => r.json()).then(d => {
      if (d?.product) setProduct(normalizeProduct(d.product));
    }).catch(()=>{});
    fetch(`${BASE_API}/api/products/comments?productId=${params.id}`).then(r=>r.json()).then(d=>{
      if (d?.reviews) setReviews(d.reviews);
    }).catch(()=>{});
  }, [params.id]);

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
      <div className="prod-card">
        <div className="prod-container">
          {/* گالری تصاویر */}
          <div className="prod-gallery">
            {(() => {
              const imageList = (product.images && product.images.length ? product.images : (product.image ? [product.image] : []));
              const validIndex = Math.min(Math.max(currentImageIndex, 0), Math.max(imageList.length - 1, 0));
              const showPrev = () => setCurrentImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
              const showNext = () => setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
              const selectIndex = (idx) => setCurrentImageIndex(idx);
              return (
                <>
                  <div
                    className="prod-main-image"
                    onTouchStart={(e)=>{
                      const t = e.touches && e.touches[0];
                      if (!t) return;
                      touchActive.current = true;
                      setIsDragging(true);
                      touchStartX.current = t.clientX;
                      touchStartY.current = t.clientY;
                      touchDeltaX.current = 0;
                      touchDeltaY.current = 0;
                      setDragX(0);
                    }}
                    onTouchMove={(e)=>{
                      if (!touchActive.current) return;
                      const t = e.touches && e.touches[0];
                      if (!t) return;
                      touchDeltaX.current = t.clientX - touchStartX.current;
                      touchDeltaY.current = t.clientY - touchStartY.current;
                      if (Math.abs(touchDeltaX.current) > Math.abs(touchDeltaY.current)) {
                        setDragX(touchDeltaX.current * 0.9);
                      }
                    }}
                    onTouchEnd={()=>{
                      if (!touchActive.current) return;
                      const dx = touchDeltaX.current;
                      const dy = touchDeltaY.current;
                      const threshold = 40;
                      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                        if (dx < 0) {
                          // swipe left -> next
                          (typeof showNext === 'function') && showNext();
                        } else {
                          // swipe right -> prev
                          (typeof showPrev === 'function') && showPrev();
                        }
                      }
                      setIsDragging(false);
                      setDragX(0);
                      touchActive.current = false;
                    }}
                  >
                    {imageList.length > 0 && (
                      <Image
                        src={imageList[validIndex]}
                        alt={`${product.name} - تصویر ${validIndex + 1}`}
                        width={600}
                        height={600}
                        className="prod-main-img"
                        priority
                        quality={90}
                        sizes="(max-width: 900px) 90vw, 45vw"
                        style={{ transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform .25s ease-out, opacity .25s ease-out', willChange: 'transform' }}
                      />
                    )}
                    {imageList.length > 1 && (
                      <>
                        <button type="button" className="nav-btn prev" aria-label="قبلی" onClick={showPrev}>❮</button>
                        <button type="button" className="nav-btn next" aria-label="بعدی" onClick={showNext}>❯</button>
                      </>
                    )}
                  </div>
                  {imageList.length > 1 && (
                    <div className="prod-thumbs" role="tablist" aria-label="تصاویر کوچک محصول">
                      {imageList.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`thumb ${idx === validIndex ? 'active' : ''}`}
                          onClick={() => selectIndex(idx)}
                          role="tab"
                          aria-selected={idx === validIndex}
                        >
                          <Image src={img} alt={`${product.name} thumbnail ${idx + 1}`} width={72} height={72} className="thumb-img" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* جزئیات محصول */}
          <div className="prod-details">
            <h1 className="prod-title">{product.name}</h1>
            <div className="prod-cat">دسته‌بندی: {typeof product.category === 'string' ? product.category : (product.category?.name || '')}</div>
            <div className="prod-price-row">
              <span className="prod-price">{(Number(product.price)||0).toLocaleString()} تومان</span>
              <span className={`prod-stock ${(Number(product.stock)||0) > 0 ? 'in-stock' : 'out-stock'}`}>
                {(Number(product.stock)||0) > 0 ? "موجود" : "ناموجود"}
              </span>
            </div>
            {false && product.bnpl?.enabled && (
              <div className="prod-bnpl">
                خرید اعتباری: {product.bnpl.installmentCount} قسط {Number(product.bnpl.installmentAmount||0).toLocaleString()} تومان
              </div>
            )}
            <div className="prod-actions">
              <button
                className="prod-btn"
                disabled={(Number(product.stock)||0) === 0 || (String(product.name||'').includes('نان') && !selectedSlot)}
                onClick={() => addToCart({ id: product._id || product.id, name: product.name, category: (typeof product.category === 'string' ? product.category : (product.category?.name || '')), price: Number(product.price)||0, images: product.images && product.images.length ? product.images : (product.image ? [product.image] : []), quantity: 1 })}
              >
                افزودن به سبد خرید
              </button>
              {/* دکمه خرید سریع حذف شد */}
              <a href="#comments" className="prod-link-comments">مشاهده نظرات</a>
            </div>
            {String(product.name||'').includes('نان') && (
              <div style={{marginTop:12}}>
                <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>زمان تحویل نان تازه</div>
                <div className="triple-row">
                  <div className="triple-card">
                    <label>تاریخ</label>
                    <input type="date" value={new Date(selectedDateISO).toISOString().slice(0,10)} onChange={(e)=>{
                      const val = e.target.value;
                      const d = new Date(val + 'T00:00:00');
                      setSelectedDateISO(d.toISOString());
                      setSelectedSlot('');
                    }} />
                  </div>
                  <div className="triple-card">
                    <label>بازه زمانی</label>
                    <DeliveryTimeSelector dateISO={selectedDateISO} value={selectedSlot} onChange={setSelectedSlot} />
                    {!selectedSlot && (<div className="hint-muted">✅ نان موجود است. لطفاً بازه زمانی تحویل را انتخاب کنید.</div>)}
                  </div>
                </div>
              </div>
            )}
            <div className="prod-desc">{product.description}</div>
          </div>
        </div>
      </div>

      {/* سکشن نظرات در انتهای صفحه */}
      <div id="comments" className="prod-comments">
        <h3 className="prod-comments-title">نظرات کاربران</h3>
        {reviews.length > 0 ? (
          reviews.map((c, i) => (
            <div key={i} className="prod-comment">
              <div className="prod-comment-user">{c.user}</div>
              <div className="prod-comment-text">{c.text}</div>
              <div className="prod-comment-date">{new Date(c.createdAt || Date.now()).toLocaleDateString('fa-IR')}</div>
            </div>
          ))
        ) : (
          <div className="prod-comment-empty">هنوز نظری ثبت نشده است.</div>
        )}

        <form onSubmit={async (e)=>{
          e.preventDefault();
          const user = typeof window !== 'undefined' ? (localStorage.getItem('user_phone')||'کاربر') : 'کاربر';
          const res = await fetch(`${BASE_API}/api/products/comments`, { method:'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product._id || params.id, user, text: reviewText }) });
          const data = await res.json();
          if (res.ok) {
            setReviewText('');
            alert('نظر شما ارسال شد و پس از تایید نمایش می‌یابد.');
          }
        }} style={{marginTop:12}}>
          <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="نظر شما" style={{width:'100%', minHeight:60, padding:8}} />
          <button className="prod-btn" type="submit">ثبت نظر</button>
        </form>
      </div>

      <style>{`
        .prod-root {
          font-family: Vazirmatn,sans-serif;
          max-width: 1100px;
          margin: 32px auto;
          padding: 0 12px;
        }
        .prod-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          padding: 24px 16px;
        }
        .prod-container {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: start;
        }
        .prod-gallery { display: flex; flex-direction: column; gap: 10px; }
        .prod-main-image { position: relative; background: #fafafa; border: 1px solid #ececec; border-radius: 14px; overflow: hidden; }
        .prod-main-img { width: 100%; height: auto; display: block; object-fit: cover; }
        .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.45); color: #fff; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .nav-btn.prev { right: 8px; }
        .nav-btn.next { left: 8px; }
        .prod-thumbs { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; }
        .thumb { border: 2px solid transparent; border-radius: 10px; padding: 2px; background: #fff; cursor: pointer; }
        .thumb.active { border-color: var(--primary); }
        .thumb-img { border-radius: 8px; display: block; }
        .prod-details {}
        .prod-title {
          font-weight: 900;
          font-size: 28px;
          color: var(--primary);
          margin-bottom: 6px;
        }
        .prod-cat { color: #777; font-size: 15px; margin-bottom: 10px; }
        .prod-desc { font-size: 16px; color: #444; margin-top: 14px; line-height: 1.9; }
        .prod-price-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 14px 0 16px 0;
          flex-wrap: wrap;
        }
        .prod-price {
          font-weight: 800;
          font-size: 22px;
          color: var(--accent);
        }
        .prod-stock.in-stock { font-size: 14px; color: var(--primary); font-weight: 700; }
        .prod-stock.out-stock { font-size: 14px; color: #c0392b; font-weight: 700; }
        .prod-bnpl {
          background: linear-gradient(90deg, var(--brand-orange-1,#FBAD1B) 10%, var(--accent,#F26826) 100%);
          color: #fff;
          border-radius: 10px;
          padding: 10px 14px;
          margin: 6px 0 14px 0;
          font-weight: 800;
          text-align: center;
        }
        .prod-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .prod-btn {
          padding: 11px 24px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
          transition: filter .15s ease;
        }
        .prod-btn:hover { filter: brightness(1.05); }
        .prod-btn:disabled { background: #ccc; cursor: not-allowed; }
        /* .buy-now-btn حذف شد */
        .prod-link-comments { color: var(--primary); font-weight: 800; text-decoration: none; }
        .prod-link-comments:hover { text-decoration: underline; }

        /* نظرات */
        .prod-comments {
          margin-top: 18px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          padding: 22px 16px;
        }
        .prod-comments-title {
          font-weight: 900;
          font-size: 20px;
          margin-bottom: 12px;
          color: var(--primary);
          text-align: center;
        }
        .prod-comment {
          background: #f8fafc;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 10px;
          box-shadow: 0 1px 6px #f1f1f1;
        }
        .prod-comment-user { font-weight: 800; color: #222; margin-bottom: 4px; }
        .prod-comment-text { font-size: 15px; margin-top: 2px; }
        .prod-comment-date { font-size: 12px; color: #888; margin-top: 2px; }
        .prod-comment-empty { color: #888; font-size: 16px; text-align: center; }

        @media (max-width: 900px) {
          .prod-container { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .prod-root { padding: 0 6px; }
          .prod-title { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}
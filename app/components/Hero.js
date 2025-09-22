'use client';

import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero-root" aria-label="معرفی فروشگاه">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">بیگ‌بیر — سوپرمارکت آنلاین با تحویل سریع</h1>
          <p className="hero-subtitle">تازه‌ترین محصولات، قیمت منصفانه، تجربه خرید ساده و سریع</p>
          <div className="hero-actions">
            <Link href="#products" className="hero-btn primary">مشاهده محصولات</Link>
            <Link href="/categories" className="hero-btn secondary">دسته‌بندی‌ها</Link>
          </div>
        </div>
        <div className="hero-stats" aria-label="آمار فروشگاه">
          <div className="stat">
            <div className="stat-num">+۲k</div>
            <div className="stat-label">محصول فعال</div>
          </div>
          <div className="stat">
            <div className="stat-num">۹۸٪</div>
            <div className="stat-label">رضایت مشتریان</div>
          </div>
          <div className="stat">
            <div className="stat-num">+۲۰</div>
            <div className="stat-label">منطقه پوشش</div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .hero-root { background:#fff; border-radius: 20px; border:1px solid #eee; margin: 20px 0 24px; }
        .hero-container { max-width:1200px; margin:0 auto; padding:22px 16px; display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .hero-content { flex:1; }
        .hero-title { color: var(--brand-purple-2,#663191); font-weight: 900; font-size: 1.9rem; margin: 0 0 8px 0; letter-spacing: .2px; }
        .hero-subtitle { color:#444; font-size: 1.05rem; margin: 0 0 14px 0; }
        .hero-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .hero-btn { display:inline-flex; align-items:center; justify-content:center; padding:10px 16px; border-radius:10px; font-weight:800; text-decoration:none; border:2px solid transparent; transition: box-shadow .2s, transform .1s, background .2s, color .2s, border-color .2s; }
        .hero-btn.primary { background: var(--brand-purple-2,#663191); color:#fff; }
        .hero-btn.primary:hover { box-shadow: 0 6px 18px rgba(102,49,145,.25); transform: translateY(-1px); }
        .hero-btn.secondary { background:#fff; color: var(--brand-purple-2,#663191); border-color: var(--brand-purple-2,#663191); }
        .hero-btn.secondary:hover { background:#f5f1fb; }
        .hero-stats { display:flex; gap:16px; align-items:center; }
        .stat { background:#faf7ff; border:1px solid #eee; border-radius:12px; padding:12px 14px; min-width:110px; text-align:center; }
        .stat-num { color: var(--brand-orange-2,#F26826); font-weight:900; font-size:1.2rem; }
        .stat-label { color:#666; font-size:.9rem; margin-top:4px; }
        @media (max-width: 900px){ .hero-container { flex-direction:column; align-items:stretch; } .hero-stats { justify-content:space-between; } }
        @media (max-width: 600px){ .hero-title { font-size:1.35rem; } .hero-subtitle { font-size:.95rem } .stat { min-width:96px; padding:10px } }
      `}</style>
    </section>
  );
}

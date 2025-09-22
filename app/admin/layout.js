'use client';

import React, { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
  const [gateOk, setGateOk] = useState(false);
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (!token) {
          if (typeof window !== 'undefined') {
            if (window.history.length > 1) window.history.back(); else window.location.replace('/');
          }
          return;
        }
        const res = await fetch(`${BASE_API}/api/admin/gate`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (!res.ok) {
          if (typeof window !== 'undefined') {
            if (window.history.length > 1) window.history.back(); else window.location.replace('/');
          }
          return;
        }
        setGateOk(true);
      } catch (_) {
        if (typeof window !== 'undefined') {
          if (window.history.length > 1) window.history.back(); else window.location.replace('/');
        }
      }
    })();
  }, []);

  if (!gateOk) return null;

  return (
    <div className="wp-admin-shell">
      <aside className="wp-sidebar">
        <div className="logo">مدیریت</div>
        <nav className="menu">
          <a href="/admin">داشبورد</a>
          <a href="/admin/products">محصولات</a>
          <a href="/admin/orders">سفارش‌ها</a>
          <a href="/admin/users">کاربران</a>
          <a href="/admin/coupons">کدتخفیف</a>
          <a href="/admin/categories">دسته‌ها</a>
          <a href="/admin/comments">نظرات</a>
          <a href="/admin/bnpl">BNPL</a>
          <a href="/admin/settings">تنظیمات</a>
        </nav>
      </aside>

      <div className="wp-main">
        <header className="wp-topbar">
          <div className="title">پنل ادمین فروشگاه</div>
          <div className="actions">
            <input className="search" placeholder="جستجو..." />
          </div>
        </header>

        <main className="wp-content">{children}</main>
      </div>

      <style jsx>{`
        .wp-admin-shell { display: flex; min-height: 100vh; background:#f1f5f9; direction: rtl; }
        .wp-sidebar { width: 230px; background:#1f2937; color:#fff; padding:16px 12px; position: sticky; top:0; height:100vh; }
        .logo { font-weight: 900; letter-spacing: .5px; margin-bottom: 16px; text-align:center; }
        .menu { display:flex; flex-direction:column; gap:6px; }
        .menu a { color:#e5e7eb; text-decoration:none; padding:9px 10px; border-radius:8px; font-size:14px; }
        .menu a:hover { background:#374151; color:#fff; }
        .wp-main { flex:1; display:flex; flex-direction:column; }
        .wp-topbar { height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; background:#ffffff; border-bottom:1px solid #e5e7eb; position: sticky; top:0; z-index:5; }
        .title { font-weight:700; color:#111827; }
        .actions .search { background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; min-width:220px; }
        .wp-content { padding:16px; }
        @media (max-width: 920px) { .wp-sidebar { display:none; } .wp-content { padding:10px; } }
      `}</style>
    </div>
  );
}



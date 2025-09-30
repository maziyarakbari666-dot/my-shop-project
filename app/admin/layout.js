'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [gateOk, setGateOk] = useState(false);
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [hasAnomaly, setHasAnomaly] = useState(false);
  const [ordersToday, setOrdersToday] = useState(0);
  const [pendingToday, setPendingToday] = useState(0);
  const pathname = usePathname();
  const wsRef = useRef(null);
  const esRef = useRef(null);

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

        // fetch insights to detect anomaly badge
        try {
          const inz = await fetch(`${BASE_API}/api/admin/insights`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
          if (inz.ok) {
            const j = await inz.json();
            if (j?.anomaly?.payload?.message) setHasAnomaly(true);
          }
        } catch(_) {}

        // subscribe WebSocket for mini metrics, fallback to SSE, conditionally based on setting
        const enable = (typeof window !== 'undefined') ? (localStorage.getItem('admin_stream_enabled') ?? 'true') !== 'false' : true;
        function cleanup() {
          try { wsRef.current?.close(); } catch(_) {}
          try { esRef.current?.close(); } catch(_) {}
          wsRef.current = null; esRef.current = null;
        }
        function connect() {
          try {
            const wsProto = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss' : 'ws';
            const wsUrl = `${wsProto}://${(typeof window !== 'undefined' ? window.location.host : 'localhost:3000').replace(/:\d+$/, ':5000')}/ws/admin/metrics`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.onmessage = (ev) => {
              try {
                const msg = JSON.parse(ev.data || '{}');
                if (msg?.type === 'metrics' && msg?.data) {
                  const data = msg.data;
                  if (typeof data.ordersToday === 'number') setOrdersToday(data.ordersToday);
                  if (typeof data.pendingToday === 'number') setPendingToday(data.pendingToday);
                  if (typeof data.hasAnomaly === 'boolean') setHasAnomaly(data.hasAnomaly);
                }
              } catch(_) {}
            };
            ws.onerror = () => { try { ws.close(); } catch(_) {}; };
            ws.onclose = () => {
              // fallback to SSE if WS closed
              try {
                const es = new EventSource(`${BASE_API}/api/admin/stream/metrics`, { withCredentials: false });
                esRef.current = es;
                es.addEventListener('metrics', (ev) => {
                  try {
                    const data = JSON.parse(ev.data || '{}');
                    if (typeof data.ordersToday === 'number') setOrdersToday(data.ordersToday);
                    if (typeof data.pendingToday === 'number') setPendingToday(data.pendingToday);
                    if (typeof data.hasAnomaly === 'boolean') setHasAnomaly(data.hasAnomaly);
                  } catch(_) {}
                });
                es.onerror = () => { es.close(); };
              } catch(_) {}
            };
          } catch(_) {}
        }
        if (enable) connect();
        const onStorage = (e) => {
          if (e.key === 'admin_stream_enabled') {
            const en = (e.newValue ?? 'true') !== 'false';
            if (!en) {
              cleanup();
            } else if (!wsRef.current && !esRef.current) {
              connect();
            }
          }
        };
        window.addEventListener('storage', onStorage);
        return () => { window.removeEventListener('storage', onStorage); cleanup(); };
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
          <a className={pathname === '/admin' ? 'active' : ''} href="/admin">داشبورد {ordersToday > 0 && <span className="pill" title="سفارش‌های امروز">{ordersToday}</span>}</a>
          <a className={pathname.startsWith('/admin/ai-dashboard') ? 'active' : ''} href="/admin/ai-dashboard">هوش‌مصنوعی {hasAnomaly && <span className="badge">!</span>}</a>
          <a className={pathname.startsWith('/admin/products') ? 'active' : ''} href="/admin/products">محصولات</a>
          <a className={pathname.startsWith('/admin/orders') ? 'active' : ''} href="/admin/orders">سفارش‌ها {pendingToday > 0 && <span className="pill" title="در انتظار امروز">{pendingToday}</span>}</a>
          <a className={pathname.startsWith('/admin/users') ? 'active' : ''} href="/admin/users">کاربران</a>
          <a className={pathname.startsWith('/admin/coupons') ? 'active' : ''} href="/admin/coupons">کدتخفیف</a>
          <a className={pathname.startsWith('/admin/categories') ? 'active' : ''} href="/admin/categories">دسته‌ها</a>
          <a className={pathname.startsWith('/admin/comments') ? 'active' : ''} href="/admin/comments">نظرات</a>
          <a className={pathname.startsWith('/admin/bnpl') ? 'active' : ''} href="/admin/bnpl">BNPL</a>
          <a className={pathname.startsWith('/admin/settings') ? 'active' : ''} href="/admin/settings">تنظیمات</a>

          <div className="groupTitle">گزارش‌ها و تحلیل</div>
          <div className="submenu">
            <a href={`${BASE_API}/api/admin/insights`} target="_blank" rel="noreferrer">بینش‌ها {hasAnomaly && <span className="badge">!</span>}</a>
            <a href={`${BASE_API}/api/admin/analytics`} target="_blank" rel="noreferrer">تحلیل فروش (JSON)</a>
            <a href={`${BASE_API}/api/admin/analytics/daily?format=csv`} target="_blank" rel="noreferrer">تحلیل روزانه (CSV)</a>
            <a href={`${BASE_API}/api/admin/top-products`} target="_blank" rel="noreferrer">محصولات پرفروش</a>
            <a href={`${BASE_API}/api/admin/reports/daily.html`} target="_blank" rel="noreferrer">گزارش روزانه (HTML)</a>
          </div>

          <div className="groupTitle">هوشمندسازی</div>
          <div className="submenu">
            <a href={`${BASE_API}/api/recommendations`} target="_blank" rel="noreferrer">پیشنهاد محصول (API)</a>
            <a className={pathname.startsWith('/support') ? 'active' : ''} href="/support">چت‌بات مشتری</a>
          </div>
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
        .menu a { color:#e5e7eb; text-decoration:none; padding:9px 10px; border-radius:8px; font-size:14px; display:flex; align-items:center; gap:6px; justify-content:space-between; }
        .menu a:hover { background:#374151; color:#fff; }
        .menu a.active { background:#111827; color:#fff; }
        .groupTitle { color:#9ca3af; font-size:12px; margin:10px 8px 4px; text-transform:uppercase; letter-spacing:.5px; }
        .submenu { display:flex; flex-direction:column; gap:6px; margin:0 0 8px 0; }
        .submenu a { padding-left:18px; }
        .badge { display:inline-flex; align-items:center; justify-content:center; margin-right:6px; background:#ef4444; color:#fff; border-radius:10px; font-size:10px; width:16px; height:16px; font-weight:700; }
        .pill { background:#10b981; color:#06281f; border-radius:999px; font-size:11px; padding:0 6px; line-height:18px; min-width:18px; text-align:center; }
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



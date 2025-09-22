'use client';

import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useEffect, useState, useCallback } from "react";

export default function Header() {
  const { cart, clearCart, lastAdded } = useCart();
  const { favorites } = useFavorites();
  const [pulse, setPulse] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const favCount = favorites.length;
  useEffect(()=>{
    if (cartCount > 0 && lastAdded) {
      setPulse(true);
      setShowCartToast(true);
      const t1 = setTimeout(()=> setPulse(false), 600);
      const t2 = setTimeout(()=> setShowCartToast(false), 1800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [cartCount, lastAdded]);
  const [auth, setAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const checkAuth = useCallback(async () => {
    let ok = false;
    try {
      const r = await fetch(apiBase + '/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d?.user) { setAuth(true); setIsAdmin(d.user.role === 'admin'); ok = true; }
      }
    } catch(_) {}
    if (ok) return;
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
      if (token) {
        const r2 = await fetch(apiBase + '/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2?.user) { setAuth(true); setIsAdmin(d2.user.role === 'admin'); return; }
        } else { setAuth(true); setIsAdmin(false); return; }
      }
    } catch(_) {}
    setAuth(false); setIsAdmin(false);
  }, [apiBase]);

  useEffect(()=>{ checkAuth(); }, [checkAuth]);

  useEffect(()=>{
    const onStorage = (e) => {
      if (!e || e.key === 'auth_token') checkAuth();
    };
    const onFocus = () => { checkAuth(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onFocus);
      }
    };
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      // ابتدا سبد را پاک می‌کنیم تا اگر توکن لازم است، در دسترس باشد
      try { await clearCart(); } catch(_) {}
      await fetch(apiBase + '/api/auth/logout', { method:'POST', credentials:'include' });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('user_phone');
        window.localStorage.removeItem('user_name');
      }
      setAuth(false);
      setIsAdmin(false);
      // رفرش صفحه برای منعکس‌شدن وضعیت جدید
      if (typeof window !== 'undefined') window.location.reload();
    } catch(_) {}
  };

  return (
    <header className="header-root">
      <div className="promo-bar">جشنواره BigBir: ارسال رایگان سفارش‌های بالای ۳۰۰٬۰۰۰ تومان 🎉</div>
      <div className="header-content">
        <Link href="/" className="logo" aria-label="خانه بیگ‌بیر">
          🐻 بیگ‌بیر
        </Link>
        <nav className="header-nav">
          <Link href="/" className="nav-link">صفحه اصلی</Link>
          <Link href="/account" className="nav-link">حساب کاربری</Link>
          {!auth && <Link href="/login" className="nav-link">ورود</Link>}
          {auth && <button onClick={handleLogout} className="nav-link" style={{ background:'transparent', border:'none', cursor:'pointer' }}>خروج</button>}
          {isAdmin && (
            <button onClick={() => {
              try {
                if (typeof document !== 'undefined') {
                  // اعطای دسترسی پایدار به داشبورد روی این مرورگر
                  // 10 سال (315360000 ثانیه)
                  document.cookie = 'admin_gate=ok; max-age=315360000; path=/; samesite=lax';
                }
                if (typeof window !== 'undefined') window.location.href = '/admin';
              } catch(_) { if (typeof window !== 'undefined') window.location.href = '/admin'; }
            }} className="nav-link" style={{ background:'transparent', border:'none', cursor:'pointer' }}>ادمین</button>
          )}
          <Link href="/favorites" className="nav-link">علاقه‌مندی‌ها {favCount>0 && (<span className="cart-count" style={{marginRight:6}}>{favCount}</span>)}</Link>
          <Link href="/cart" className={`nav-link cart-link ${pulse?'cart-pulse':''}`}>
            <span>سبد خرید</span>
            <span className="cart-count">{cartCount}</span>
            {showCartToast && (
              <span className="cart-toast" aria-live="polite">به سبد اضافه شد</span>
            )}
          </Link>
        </nav>
      </div>
      <style>{`
        .header-root { background:#fff; box-shadow:0 2px 13px #eee; padding:0; margin-bottom:12px; position: sticky; top: 0; z-index: 1000; }
        .promo-bar {
          background: linear-gradient(90deg, var(--primary), var(--accent));
          color: #fff;
          font-weight: 700;
          text-align: center;
          padding: 6px 10px;
          font-size: 0.95rem;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 14px;
        }
        .logo {
          font-size: 1.5rem;
          color: var(--primary);
          font-weight: bold;
          text-decoration: none;
        }
        .header-nav {
          display: flex;
          gap: 19px;
        }
        .nav-link {
          color: #444;
          font-size: 1.03rem;
          font-weight: bold;
          text-decoration: none;
          padding: 4px 13px;
          border-radius: 7px;
          transition: background .2s, color .2s;
        }
        .nav-link:hover {
          background: #efe8ff;
          color: var(--primary);
        }
        .cart-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cart-count {
          background: var(--accent);
          color: #fff;
          font-size: 0.97rem;
          min-width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .cart-pulse .cart-count {
          animation: cart-bounce .6s ease;
          box-shadow: 0 0 0 6px rgba(242,104,38,0.15);
        }
        .cart-pulse::after {
          content: '';
          position: absolute;
          right: -4px; top: -4px;
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--brand-orange-1,#FBAD1B);
          animation: ping .8s ease;
        }
        .cart-toast {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 10px;
          background: #222;
          color: #fff;
          font-size: 0.85rem;
          padding: 6px 10px;
          border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.14);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          animation: toast-in .18s ease forwards;
        }
        .cart-toast::after {
          content: '';
          position: absolute;
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
          border-style: solid;
          border-width: 6px 0 6px 6px;
          border-color: transparent transparent transparent #222;
        }
        @keyframes ping {
          0% { transform: scale(0.9); opacity: .9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-50%) translateX(8px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes cart-bounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.25) rotate(-8deg); }
          60% { transform: scale(0.95) rotate(6deg); }
          100% { transform: scale(1); }
        }
        @media (max-width: 600px) {
          .header-content { padding: 8px 4px; }
          .logo { font-size: 1.1rem;}
          .header-nav { gap: 7px;}
          .nav-link { font-size: 0.92rem; padding: 3px 5px;}
          .cart-count { min-width: 18px; height: 18px; font-size: 0.87rem;}
        }
      `}</style>
    </header>
  );
}
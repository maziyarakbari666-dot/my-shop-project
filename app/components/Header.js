'use client';

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="header-root">
      <div className="header-content">
        <Link href="/" className="logo">
          🥖 فروشگاه تازه‌فود
        </Link>
        <nav className="header-nav">
          <Link href="/" className="nav-link">صفحه اصلی</Link>
          <Link href="/account" className="nav-link">حساب کاربری</Link>
          <Link href="/cart" className="nav-link cart-link">
            <span>سبد خرید</span>
            <span className="cart-count">{cartCount}</span>
          </Link>
        </nav>
      </div>
      <style>{`
        .header-root {
          background: #fff;
          box-shadow: 0 2px 13px #eee;
          padding: 0;
          margin-bottom: 12px;
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
          color: #27ae60;
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
          background: #eafaf1;
          color: #27ae60;
        }
        .cart-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cart-count {
          background: #e67e22;
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
'use client';

import React from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import toast from "react-hot-toast";

// هزینه ارسال ثابت (نمایشی؛ مبلغ نهایی در چک‌اوت محاسبه می‌شود)
const DELIVERY_FEE = 35000;
const DISCOUNT = 0; // تخفیف در چک‌اوت اعمال می‌شود
const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 500000);

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const finalAmount = totalPrice + shippingFee - DISCOUNT;

  const handleRemoveFromCart = (id, name) => {
    removeFromCart(id);
    toast.success(`${name} از سبد خرید حذف شد`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success("سبد خرید با موفقیت خالی شد");
  };

  return (
    <div className="cart-wrap">
      <div className="cart-header">
        <h1 className="cart-title">سبد خرید</h1>
        <div className="cart-meta">{cart.length} آیتم</div>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty">
          سبد خرید شما خالی است!
          <div style={{ marginTop: 14 }}>
            <Link href="/">
              <button className="btn primary">مشاهده محصولات</button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-main" aria-label="لیست اقلام سبد">
            {cart.map((item) => (
              <div key={item.id} className="cart-row">
                <div className="thumb">
                  <Image
                    src={item.images?.[0] || "/demo/placeholder.jpg"}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="thumb-img"
                  />
                </div>
                <div className="info">
                  <div className="name">{item.name}</div>
                  <div className="price-line">
                    <span className="price">{item.price.toLocaleString()} تومان</span>
                    {item.category && <span className="tag">{item.category}</span>}
                  </div>
                </div>
                <div className="qty">
                  <button
                    className="icon-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="کاهش تعداد"
                    title="کاهش تعداد"
                  >−</button>
                  <span className="qty-val" aria-live="polite">{item.quantity}</span>
                  <button
                    className="icon-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="افزایش تعداد"
                    title="افزایش تعداد"
                  >+</button>
                </div>
                <div className="row-actions">
                  <button
                    className="icon-link danger"
                    onClick={() => handleRemoveFromCart(item.id, item.name)}
                    aria-label="حذف از سبد"
                    title="حذف"
                  >حذف</button>
                </div>
              </div>
            ))}

            <div className="toolbar">
              <button className="btn danger" onClick={handleClearCart}>خالی کردن سبد</button>
              <Link href="/products" className="btn link">انتخاب محصول دیگر</Link>
            </div>
          </div>

          <aside className="cart-aside" aria-label="خلاصه سفارش">
            <div className="box">
              <div className="box-title">خلاصه سفارش</div>
              <div className="row">
                <span>جمع اقلام</span>
                <span>{totalPrice.toLocaleString()} تومان</span>
              </div>
              <div className="row">
                <span>هزینه ارسال</span>
                <span>
                  {shippingFee.toLocaleString()} تومان{shippingFee === 0 ? " (ارسال رایگان)" : ""}
                </span>
              </div>
              {DISCOUNT > 0 && (
                <div className="row muted">
                  <span>تخفیف</span>
                  <span>- {DISCOUNT.toLocaleString()} تومان</span>
                </div>
              )}
              <div className="divider" />
              <div className="row total">
                <span>مبلغ قابل پرداخت</span>
                <span>{finalAmount.toLocaleString()} تومان</span>
              </div>
              <Link href="/checkout">
                <button className="btn primary full">ادامه ثبت سفارش</button>
              </Link>
            </div>
            <div className="box hint">
              <div className="hint-title">شرایط ارسال</div>
              <ul>
                <li>ارسال رایگان برای سفارش‌های بالای {FREE_SHIPPING_THRESHOLD.toLocaleString()} تومان</li>
                <li>امکان پرداخت آنلاین و در محل</li>
                <li>ثبت بازه زمانی دلخواه در مرحله بعد</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .cart-wrap { max-width: 1200px; margin: 24px auto; padding: 0 12px; font-family: Vazirmatn, sans-serif; }
        .cart-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .cart-title { margin:0; font-size:1.6rem; font-weight:900; color: var(--brand-purple-2,#663191); }
        .cart-meta { color:#666; font-weight:700; }

        .cart-empty { text-align:center; color:#888; font-size:1rem; padding: 60px 0; background:#fff; border-radius:16px; border:1px solid #eee; }

        .cart-grid { display:grid; grid-template-columns: 1.6fr .9fr; gap: 18px; align-items:start; }

        .cart-main { background:#fff; border:1px solid #eee; border-radius:16px; padding: 14px; }
        .cart-row { display:grid; grid-template-columns: 80px 1fr auto auto; gap: 12px; align-items:center; padding:10px; border:1px solid #f2f2f2; border-radius:12px; margin-bottom:10px; }
        .thumb { display:flex; align-items:center; justify-content:center; }
        .thumb-img { border-radius:10px; object-fit:cover; border:1px solid #eee; }
        .info { min-width:0; }
        .name { font-weight:900; color: var(--brand-purple-2,#663191); margin:0 0 4px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .price-line { display:flex; align-items:center; gap:8px; }
        .price { color: var(--brand-orange-2,#F26826); font-weight:800; }
        .tag { background:#faf7ff; border:1px solid #eee; color:#555; padding:3px 8px; border-radius:999px; font-size:.8rem; }
        .qty { display:flex; align-items:center; gap:8px; }
        .icon-btn { width:32px; height:32px; border:1px solid #ddd; border-radius:8px; background:#fff; font-size:20px; line-height:0; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .icon-btn:disabled { opacity:.4; cursor:not-allowed; }
        .qty-val { min-width:22px; text-align:center; font-weight:800; }
        .row-actions { display:flex; justify-content:flex-end; }
        .icon-link { background:#fff; border:1px solid #eee; color:#444; border-radius:8px; padding:7px 12px; cursor:pointer; font-weight:700; }
        .icon-link.danger { color:#e74c3c; border-color:#f5c6cb; background:#fff5f5; }

        .toolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:8px; }

        .cart-aside { position: sticky; top: 84px; display:flex; flex-direction:column; gap:12px; }
        .box { background:#fff; border:1px solid #eee; border-radius:16px; padding:14px; }
        .box-title { font-weight:900; color:#222; margin-bottom:10px; }
        .row { display:flex; align-items:center; justify-content:space-between; margin: 10px 0; }
        .row.muted { color:#888; }
        .row.total { font-weight:900; color: var(--brand-purple-2,#663191); font-size:1.05rem; }
        .divider { height:1px; background:#f0f0f0; margin:10px 0; }

        .hint { font-size:.92rem; }
        .hint-title { font-weight:800; color:#444; margin-bottom:8px; }
        .hint ul { margin:0; padding:0 1rem 0 0; color:#666; }
        .hint li { margin:6px 0; }

        .btn { border:none; border-radius:10px; padding:11px 18px; font-weight:900; cursor:pointer; }
        .btn.full { width:100%; }
        .btn.primary { background: var(--brand-purple-2,#663191); color:#fff; }
        .btn.danger { background:#fff5f5; color:#e74c3c; border:1px solid #f5c6cb; }
        .btn.link { background:#fff; color: var(--brand-purple-2,#663191); border:1px solid #eee; text-decoration:none; display:inline-flex; align-items:center; }

        @media (max-width: 980px) { .cart-grid { grid-template-columns: 1fr; } .cart-aside { position:static; } }
        @media (max-width: 600px) { .cart-row { grid-template-columns: 64px 1fr auto; } .row-actions { grid-column: 3 / 4; } }
      `}</style>
    </div>
  );
}
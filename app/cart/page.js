'use client';

import React from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import toast from "react-hot-toast";

// دمو: هزینه ارسال و تخفیف
const DELIVERY_FEE = 35000;
const DISCOUNT = 20000; // دمو

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  // جمع مبلغ محصولات
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // مبلغ نهایی (جمع مبلغ + هزینه ارسال - تخفیف)
  const finalAmount = totalPrice + DELIVERY_FEE - DISCOUNT;

  // حذف محصول با Toast
  const handleRemoveFromCart = (id, name) => {
    removeFromCart(id);
    toast.success(`${name} از سبد خرید حذف شد`);
  };

  // خالی کردن سبد با Toast
  const handleClearCart = () => {
    clearCart();
    toast.success("سبد خرید با موفقیت خالی شد");
  };

  return (
    <div className="cart-root">
      <h2 className="cart-title">
        سبد خرید شما
      </h2>
      {cart.length === 0 ? (
        <div className="cart-empty">
          سبد خرید شما خالی است!
        </div>
      ) : (
        <>
          {/* لیست محصولات سبد */}
          <div className="cart-list">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.images?.[0] || "/demo/placeholder.jpg"} alt={item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">
                    قیمت: {item.price.toLocaleString()} تومان
                  </div>
                </div>
                {/* مدیریت تعداد */}
                <div className="cart-item-quantity">
                  <button
                    className="cart-quantity-btn cart-quantity-minus"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >−</button>
                  <span className="cart-quantity-count">{item.quantity}</span>
                  <button
                    className="cart-quantity-btn cart-quantity-plus"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >+</button>
                </div>
                {/* حذف محصول */}
                <button
                  onClick={() => handleRemoveFromCart(item.id, item.name)}
                  className="cart-remove-btn"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
          {/* جمع مبلغ */}
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>جمع مبلغ محصولات</span>
              <span>{totalPrice.toLocaleString()} تومان</span>
            </div>
            <div className="cart-summary-row">
              <span>هزینه ارسال</span>
              <span>{DELIVERY_FEE.toLocaleString()} تومان</span>
            </div>
            <div className="cart-summary-row cart-summary-discount">
              <span>تخفیف</span>
              <span>- {DISCOUNT.toLocaleString()} تومان</span>
            </div>
            <div className="cart-summary-row cart-summary-final">
              <span>مبلغ قابل پرداخت</span>
              <span>{finalAmount.toLocaleString()} تومان</span>
            </div>
          </div>
          {/* دکمه‌ها */}
          <div className="cart-actions">
            <button
              onClick={handleClearCart}
              className="cart-clear-btn"
            >
              خالی کردن کل سبد خرید
            </button>
            <Link href="/checkout">
              <button className="cart-checkout-btn">
                ادامه ثبت سفارش
              </button>
            </Link>
          </div>
        </>
      )}

      {/* استایل ریسپانسیو */}
      <style>{`
        .cart-root {
          max-width: 830px;
          margin: 44px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 26px;
        }
        .cart-title {
          font-weight: bold;
          font-size: 25px;
          color: #27ae60;
          margin-bottom: 20px;
          text-align: center;
        }
        .cart-empty {
          text-align: center;
          color: #888;
          font-size: 18px;
          padding: 40px 0;
        }
        .cart-list {
          margin-bottom: 18px;
          border-bottom: 1px solid #f3f3f3;
          padding-bottom: 12px;
        }
        .cart-item {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-bottom: 14px;
          background: #fafafa;
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 1px 8px #eee;
        }
        .cart-item-image {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #ececec;
        }
        .cart-item-info {
          flex: 1;
        }
        .cart-item-name {
          font-weight: bold;
          font-size: 18px;
          color: #27ae60;
        }
        .cart-item-price {
          font-size: 15px;
          color: #888;
          margin-top: 2px;
        }
        .cart-item-quantity {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cart-quantity-btn {
          border: none;
          border-radius: 7px;
          width: 32px;
          height: 32px;
          font-size: 23px;
          cursor: pointer;
        }
        .cart-quantity-minus {
          background: #e67e22;
          color: #fff;
        }
        .cart-quantity-plus {
          background: #27ae60;
          color: #fff;
        }
        .cart-quantity-count {
          padding: 0 8px;
          font-weight: bold;
          font-size: 18px;
        }
        .cart-remove-btn {
          background: #c0392b;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 7px 15px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          margin-right: 12px;
        }
        .cart-summary {
          background: #f7f7f7;
          border-radius: 12px;
          padding: 20px 24px;
          box-shadow: 0 1px 10px #eee;
          margin-bottom: 28px;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
        }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 17px;
        }
        .cart-summary-discount {
          color: #e67e22;
          font-size: 16px;
        }
        .cart-summary-final {
          font-weight: bold;
          font-size: 19px;
          color: #27ae60;
        }
        .cart-actions {
          text-align: center;
          margin-bottom: 18px;
        }
        .cart-clear-btn {
          background: #c0392b;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 12px 36px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-right: 18px;
        }
        .cart-checkout-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 12px 36px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }

        /* ریسپانسیو */
        @media (max-width: 900px) {
          .cart-root {
            padding: 22px 7px;
          }
          .cart-summary {
            padding: 16px 7px;
          }
          .cart-item {
            gap: 14px;
            padding: 8px 5px;
          }
        }
        @media (max-width: 600px) {
          .cart-root {
            padding: 8px 2px;
          }
          .cart-title {
            font-size: 20px;
          }
          .cart-item-image {
            width: 47px !important;
            height: 47px !important;
          }
          .cart-item-name {
            font-size: 15px;
          }
          .cart-item-price {
            font-size: 13px;
          }
          .cart-summary {
            padding: 10px 2px;
            font-size: 14px;
          }
          .cart-actions button {
            padding: 11px 14px !important;
            font-size: 15px !important;
          }
        }
        /* چینش آیتم‌ها در موبایل: زیر هم */
        @media (max-width: 480px) {
          .cart-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
          }
          .cart-remove-btn {
            margin-right: 0;
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
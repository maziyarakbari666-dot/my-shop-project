'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import toast from "react-hot-toast";

export default function AdminPage() {
  const [gateOk, setGateOk] = useState(false);
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function checkAdminGate() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (!token) {
          window.location.href = '/login?redirect=/admin';
          return;
        }
        
        const res = await fetch(`${BASE_API}/api/admin/gate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          window.location.href = '/login?redirect=/admin';
          return;
        }
        
        setGateOk(true);
      } catch (e) {
        console.error('Admin gate error:', e);
        window.location.href = '/login?redirect=/admin';
      }
    }
    
    checkAdminGate();
  }, []);

  if (!gateOk) { return null; }

  return (
    <div className="admin-root">
      <h2 className="admin-title">
        <span className="admin-icon">🛒</span> پنل مدیریت فروشگاه
      </h2>

      {/* کارت‌های دسترسی سریع */}
      <div className="admin-cards">
        <Link href="/admin/orders" className="admin-card">
          <span className="card-icon">📝</span>
          <h3>سفارش‌ها</h3>
          <p>مدیریت و پیگیری سفارشات</p>
        </Link>
        
        <Link href="/admin/products" className="admin-card">
          <span className="card-icon">📦</span>
          <h3>محصولات</h3>
          <p>افزودن و ویرایش محصولات</p>
        </Link>
        
        <Link href="/admin/users" className="admin-card">
          <span className="card-icon">👥</span>
          <h3>کاربران</h3>
          <p>مدیریت کاربران و مشتریان</p>
        </Link>
        
        <Link href="/admin/couriers" className="admin-card">
          <span className="card-icon">🚴‍♀️</span>
          <h3>پیک‌ها</h3>
          <p>ثبت و مدیریت پیک‌ها</p>
        </Link>
        
        <Link href="/admin/bnpl" className="admin-card">
          <span className="card-icon">💳</span>
          <h3>BNPL</h3>
          <p>مدیریت خرید اعتباری</p>
        </Link>
        
        <Link href="/admin/coupons" className="admin-card">
          <span className="card-icon">🏷️</span>
          <h3>کدتخفیف</h3>
          <p>مدیریت کدهای تخفیف</p>
        </Link>
        
        <Link href="/admin/categories" className="admin-card">
          <span className="card-icon">🗂️</span>
          <h3>دسته‌ها</h3>
          <p>مدیریت دسته‌بندی محصولات</p>
        </Link>
        
        <Link href="/admin/comments" className="admin-card">
          <span className="card-icon">💬</span>
          <h3>نظرات</h3>
          <p>بررسی و تایید نظرات</p>
        </Link>
        
        <Link href="/admin/settings" className="admin-card">
          <span className="card-icon">⚙️</span>
          <h3>تنظیمات</h3>
          <p>تنظیمات عمومی سایت</p>
        </Link>
      </div>

      {/* دکمه اجرای دستی تعامل مشتری */}
      <div className="admin-actions">
        <button
          className="run-btn"
          disabled={running}
          onClick={async () => {
            try {
              setRunning(true);
              const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
              if (!token) {
                toast.error('ابتدا وارد شوید.');
                window.location.href = '/login?redirect=/admin';
                return;
              }
              const res = await fetch(`${BASE_API}/api/admin/engagement/run`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                toast.success('وظایف تعامل با موفقیت اجرا شد.');
              } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data?.message || 'اجرای تعامل ناموفق بود.');
              }
            } catch (e) {
              toast.error('خطای غیرمنتظره در اجرای تعامل');
            } finally {
              setRunning(false);
            }
          }}
        >
          {running ? 'در حال اجرا...' : 'اجرای تعاملات مشتری'}
        </button>
      </div>

      {/* استایل مدرن و ریسپانسیو */}
      <style>{`
        .admin-root {
          font-family: Vazirmatn,sans-serif;
          direction: rtl;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .admin-title {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--brand-purple-2,#663191);
          margin-bottom: 32px;
          text-align: center;
          letter-spacing: 1px;
        }

        .admin-icon {
          font-size: 2.5rem;
          margin-left: 12px;
        }

        .admin-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .admin-card {
          background: white;
          border-radius: 12px;
          padding: 20px 16px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .admin-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border-color: #ff7f23;
        }

        .card-icon {
          font-size: 2.2rem;
          margin-bottom: 12px;
          display: block;
        }

        .admin-card h3 {
          font-size: 1.1rem;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 6px;
        }

        .admin-card p {
          color: #718096;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
        }

        .admin-actions {
          margin-top: 28px;
          display: flex;
          justify-content: center;
        }
        .run-btn {
          background: linear-gradient(135deg, #ff7f23, #ff9f4d);
          color: #fff;
          border: 0;
          border-radius: 10px;
          padding: 12px 20px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(255,127,35,0.35);
          transition: transform .15s ease, box-shadow .2s ease, opacity .2s;
        }
        .run-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(255,127,35,0.45); }
        .run-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ریسپانسیو */
        @media (max-width: 768px) {
          .admin-root {
            padding: 16px 8px;
          }
          .admin-title {
            font-size: 1.8rem;
          }
          .admin-cards {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
          }
          .admin-card {
            padding: 16px 12px;
          }
          .card-icon {
            font-size: 2rem;
          }
          .admin-card h3 {
            font-size: 1rem;
          }
          .admin-card p {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .admin-cards {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .admin-title {
            font-size: 1.5rem;
          }
          .admin-card {
            padding: 14px 8px;
          }
          .card-icon {
            font-size: 1.8rem;
          }
          .admin-card h3 {
            font-size: 0.9rem;
          }
          .admin-card p {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

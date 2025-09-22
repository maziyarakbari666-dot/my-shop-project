'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function ProfilePage() {
  const { clearCart } = useCart();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState({
    name: typeof window !== 'undefined' ? (localStorage.getItem('user_phone') || 'کاربر') : 'کاربر',
    phone: typeof window !== 'undefined' ? (localStorage.getItem('user_phone') || '') : '',
    email: ''
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [depositAmount, setDepositAmount] = useState('');
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    let cancelled = false;
    // اگر توکن لوکال هست، موقتا وضعیت را لاگین در نظر بگیریم تا UI خالی نباشد
    try {
      if (typeof window !== 'undefined') {
        const t = localStorage.getItem('auth_token');
        if (t) setIsAuthed(true);
      }
    } catch(_) {}
    (async()=>{
      try {
        const tokenLs = (typeof window !== 'undefined') ? localStorage.getItem('auth_token') : '';
        let authed = Boolean(tokenLs);
        let r = await fetch(`${BASE_API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
        if (r.ok) { const d = await r.json(); if (d?.user) authed = true; }
        if (!authed && tokenLs) {
          const r2 = await fetch(`${BASE_API}/api/auth/me`, { headers: { Authorization: `Bearer ${tokenLs}` }, cache: 'no-store' });
          if (r2.ok) { const d2 = await r2.json(); if (d2?.user) authed = true; }
          else { authed = true; }
        }
        if (!cancelled) setIsAuthed(authed);
      } catch(_) {
        if (!cancelled) {
          const hasToken = (typeof window !== 'undefined') ? Boolean(localStorage.getItem('auth_token')) : false;
          setIsAuthed(hasToken);
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    if (!token) return () => { cancelled = true; };
    fetch(`${BASE_API}/api/wallet`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.wallet) setWallet(d.wallet); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) { setUser({ ...user, name: editName, phone: editPhone }); setShowEdit(false); return; }
      const res = await fetch(`${BASE_API}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'خطا در ذخیره نام');
      setUser({ ...user, name: data.user?.name || editName, phone: editPhone });
      if (typeof window !== 'undefined') {
        if (data.user?.name) localStorage.setItem('user_name', data.user.name);
        if (editPhone) localStorage.setItem('user_phone', editPhone);
      }
      setShowEdit(false);
    } catch (err) {
      alert(err.message || 'خطا');
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    const amount = Number(depositAmount) || 0;
    if (amount <= 0) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    if (!token) return alert('ابتدا وارد شوید');
    const res = await fetch(`${BASE_API}/api/wallet/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount, ref: 'manual' })
    });
    const data = await res.json();
    if (res.ok) {
      setWallet(data.wallet);
      setDepositAmount('');
    }
  }

  if (!authChecked) {
    return (
      <div className="profile-root" style={{ textAlign:'center', padding:'40px 0' }}>
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="profile-root" style={{ textAlign:'center', padding:'40px 0' }}>
        <h2 className="profile-title">پروفایل کاربری</h2>
        <div className="wallet-box" style={{ marginTop: 16 }}>
          برای مشاهده پروفایل، ابتدا وارد شوید.
          <div style={{ marginTop: 12 }}>
            <a href="/login" className="profile-orders-btn" style={{ textDecoration:'none' }}>ورود</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-root">
      <h2 className="profile-title">پروفایل کاربری</h2>
      <div className="profile-info">
        {showEdit ? (
          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <label>نام:</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} />
            <label>شماره موبایل:</label>
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            <button type="submit" className="profile-save-btn">ذخیره</button>
            <button type="button" className="profile-cancel-btn" onClick={() => setShowEdit(false)}>انصراف</button>
          </form>
        ) : (
          <>
            <div><b>نام:</b> {user.name}</div>
            <div><b>شماره موبایل:</b> {user.phone}</div>
            <div><b>ایمیل:</b> {user.email || '-'} </div>
            <button className="profile-edit-btn" onClick={() => setShowEdit(true)}>ویرایش مشخصات</button>
          </>
        )}
      </div>

      <div className="profile-wallet">
        <div className="profile-address-title">کیف پول</div>
        <div className="wallet-box">
          <div>موجودی: <b style={{ color: '#27ae60' }}>{wallet.balance?.toLocaleString?.() || 0}</b> تومان</div>
          <form onSubmit={handleDeposit} className="wallet-form">
            <input type="number" min="1000" step="1000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="مبلغ واریز" />
            <button type="submit">واریز</button>
          </form>
        </div>
      </div>

      <div className="profile-actions">
        <Link href="/orders"><button className="profile-orders-btn">سفارش‌های من</button></Link>
        <button className="profile-logout-btn" onClick={async () => {
          const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          try {
            // ابتدا سبد را پاک می‌کنیم
            try { if (typeof window !== 'undefined') localStorage.removeItem('cart'); } catch(_) {}
            await fetch(`${BASE_API}/api/auth/logout`, { method:'POST', credentials:'include' });
          } catch(_) {}
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_logged_in');
              localStorage.removeItem('user_phone');
              localStorage.removeItem('user_name');
              localStorage.removeItem('cart');
            } catch(_) {}
          }
          try { await clearCart(); } catch(_){ }
          if (typeof window !== 'undefined') window.location.reload();
        }}>خروج از حساب</button>
      </div>
      <style>{`
        .profile-root { max-width: 500px; margin: 44px auto; background: #fff; border-radius: 22px; box-shadow: 0 2px 18px #eee; padding: 29px 16px; font-family: Vazirmatn,sans-serif; }
        .profile-title { font-size: 1.2rem; color: var(--accent); font-weight: bold; margin-bottom: 19px; text-align: center; }
        .profile-info { margin-bottom: 25px; background: #f8fafc; border-radius: 13px; padding: 13px 14px; font-size: 1rem; }
        .profile-edit-btn, .profile-save-btn, .profile-cancel-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 7px 24px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 12px; margin-right: 8px; }
        .profile-cancel-btn { background: #e67e22; }
        .profile-edit-form label { font-weight: bold; color: var(--accent); margin-top: 7px; }
        .profile-edit-form input { padding: 8px 10px; border-radius: 7px; border: 1px solid #eee; margin-bottom: 7px; font-size: 16px; }
        .profile-address-title { font-weight: bold; color: #213e32; margin-bottom: 9px; }
        .profile-wallet { margin: 18px 0; }
        .wallet-box { background:#f8fafc; border-radius: 13px; padding: 13px 14px; box-shadow: 0 1px 8px #eee; }
        .wallet-form { display:flex; gap:8px; margin-top: 10px; }
        .wallet-form input { flex:1; padding:8px 10px; border:1px solid #ddd; border-radius:8px; }
        .wallet-form button { background:#3498db; color:#fff; border:none; border-radius:8px; padding:8px 14px; font-weight:bold; cursor:pointer; }
        .profile-actions { text-align: center; margin-top: 24px; display: flex; gap: 18px; justify-content: center; }
        .profile-orders-btn { background: var(--accent); color: #fff; border: none; border-radius: 9px; padding: 11px 28px; font-size: 15px; font-weight: bold; cursor: pointer; }
        .profile-logout-btn { background: #c0392b; color: #fff; border: none; border-radius: 9px; padding: 11px 28px; font-size: 15px; font-weight: bold; cursor: pointer; }
        @media (max-width: 600px) { .profile-root { padding: 7px 2px;} }
      `}</style>
    </div>
  );
}
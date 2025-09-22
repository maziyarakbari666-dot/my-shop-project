'use client';

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const ordersDemo = [
  {
    id: "ORD-101",
    date: "1402/06/10",
    status: "پرداخت شده",
    items: [
      { name: "نان تست", qty: 2, price: 20000 },
      { name: "شیرینی خامه‌ای", qty: 1, price: 50000 },
    ],
    total: 90000,
    type: "معمولی"
  },
  {
    id: "ORD-102",
    date: "1402/06/08",
    status: "تکمیل شده",
    items: [
      { name: "سبزیجات آماده", qty: 1, price: 30000 },
    ],
    total: 30000,
    type: "BNPL"
  }
];

const walletDemo = { balance: 120000 };

const addressesDemo = [];

const bnplDemo = {
  paid: 2,
  total: 4,
  nextDue: "1402/07/01",
  remaining: 40000
};

const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Jalali helpers
function div(a,b){ return ~~(a/b); }
function mod(a,b){ return a-~~(a/b)*b; }
function gregorianToJalali(gy,gm,gd){ gy=+gy; gm=+gm; gd=+gd; var g_d_m=[0,31,59,90,120,151,181,212,243,273,304,334]; var jy=(gy<=1600)?0:979; gy -= (gy<=1600)?621:1600; var gy2 = gm>2?gy+1:gy; var days = 365*gy + div(gy2,4) - div(gy2,100) + div(gy2,400) - 80 + gd + g_d_m[gm-1]; jy += 33*div(days,12053); days = mod(days,12053); jy += 4*div(days,1461); days = mod(days,1461); if (days>365){ jy += div(days-1,365); days = mod(days-1,365); } var jm = (days<186)?1+div(days,31):7+div(days-186,30); var jd = 1 + mod(days,(days<186?31:30)); return [jy+1,jm,jd]; }
function pad2(n){ return String(n).padStart(2,'0'); }
function formatJalaliDate(dateObj){ if(!(dateObj instanceof Date)) return '-'; const [jy,jm,jd]=gregorianToJalali(dateObj.getFullYear(), dateObj.getMonth()+1, dateObj.getDate()); return `${jy}/${pad2(jm)}/${pad2(jd)}`; }

export default function AccountPage() {
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [wallet, setWallet] = useState({ balance: 0 });
  const [bnpl, setBnpl] = useState({ paid: 0, total: 0, nextDue: '-', remaining: 0 });
  const [bnplPlans, setBnplPlans] = useState([]);
  const [notifyOn, setNotifyOn] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', phone: '' });
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const userPhone = userInfo.phone || 'شماره ثبت نشده';
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const statusFa = { pending: 'در انتظار پرداخت', paid: 'پرداخت شده', shipped: 'ارسال شده', delivered: 'تکمیل شده', cancelled: 'لغو شده' };

  function handleAddAddress(e) {
    e.preventDefault();
    if (!newAddress.trim()) { toast.error("لطفا آدرس معتبر وارد کنید."); return; }
    (async()=>{
      try {
        const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (!token) throw new Error('ابتدا وارد شوید');
        const res = await fetch(`${BASE_API}/api/addresses`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ line: newAddress }) });
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : { error: await res.text() };
        if (!res.ok) throw new Error(data?.error||'خطا در ثبت آدرس');
        setAddresses(prev => [...prev, data.address]);
        setNewAddress('');
        toast.success('آدرس ثبت شد');
      } catch (e) { toast.error(e.message||'خطا'); }
    })();
  }

  useEffect(() => {
    let cancelled = false;
    // اگر توکن در localStorage هست، موقتا کاربر را لاگین در نظر بگیر تا UI خالی نباشد
    try {
      if (typeof window !== 'undefined') {
        const t = localStorage.getItem('auth_token');
        if (t) setIsAuthed(true);
      }
    } catch(_) {}
    (async()=>{
      try {
        // بررسی وضعیت لاگین با کوکی و سپس توکن
        const tokenLs = (typeof window !== 'undefined') ? localStorage.getItem('auth_token') : '';
        let authed = Boolean(tokenLs);
        let r = await fetch(`${BASE_API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          if (d?.user) authed = true;
        }
        if (!authed && tokenLs) {
          const r2 = await fetch(`${BASE_API}/api/auth/me`, { headers: { Authorization: `Bearer ${tokenLs}` }, cache: 'no-store' });
          if (r2.ok) {
            const d2 = await r2.json();
            if (d2?.user) authed = true;
          } else {
            // اگر احراز هویت با سرور شکست خورد ولی توکن لوکال داریم، همچنان اجازه نمایش UI بده
            authed = true;
          }
        }
        if (!cancelled) setIsAuthed(authed);
      } catch(_) {
        // در صورت خطا؛ اگر توکن لوکال داریم، همچنان اجازه نمایش بده
        if (!cancelled) {
          const hasToken = (typeof window !== 'undefined') ? Boolean(localStorage.getItem('auth_token')) : false;
          setIsAuthed(hasToken);
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    const BASE_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    // Initialize from localStorage to avoid SSR/CSR mismatch
    try {
      if (typeof window !== 'undefined') {
        const lsPhone = localStorage.getItem('user_phone') || '';
        const lsName = localStorage.getItem('user_name') || '';
        setUserInfo(prev => ({ name: lsName || prev.name, phone: lsPhone || prev.phone }));
      }
    } catch(_) {}
    // Try to fetch user profile for name and phone (Bearer or cookie)
    (async()=>{
      try {
        let profile = null;
        // Prefer cookie-based if available
        let r = await fetch(`${BASE_API}/api/auth/me`, { credentials: 'include' });
        if (r.ok) { const d = await r.json(); profile = d?.user || null; }
        if (!profile && token) {
          const r2 = await fetch(`${BASE_API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (r2.ok) { const d2 = await r2.json(); profile = d2?.user || null; }
        }
        if (profile) {
          const phone = (typeof window !== 'undefined' ? (localStorage.getItem('user_phone') || '') : '');
          const name = profile.name || '';
          setUserInfo({ name, phone });
          if (typeof window !== 'undefined' && name) localStorage.setItem('user_name', name);
        }
      } catch(_) {}
    })();
    if (!token) return () => { cancelled = true; };
    (async()=>{
      try {
        const w = await fetch(`${BASE_API}/api/wallet`, { headers: { Authorization: `Bearer ${token}` } });
        const wd = await w.json();
        if (w.ok && wd?.wallet) setWallet({ balance: Number(wd.wallet.balance)||0 });
      } catch (_) {}
      try {
        const r = await fetch(`${BASE_API}/api/orders?page=1&pageSize=3`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) { setOrders(d.orders||[]); setOrdersTotal(Number(d.total||0)); }
      } catch(_) {}
      try {
        const r = await fetch(`${BASE_API}/api/bnpl/my-plans`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok && Array.isArray(d?.plans)) {
          setBnplPlans(d.plans);
          if (d.plans.length) {
            const p = d.plans[0];
            const next = (p.installments || []).find(i => i.status !== 'paid');
            const paidCount = (p.installments || []).filter(i => i.status === 'paid').length;
            setBnpl({
              paid: paidCount,
              total: (p.installments || []).length,
              nextDue: next?.dueDate ? formatJalaliDate(new Date(next.dueDate)) : '-',
              remaining: Math.max(0, Number(p.totalAmount || 0) - (p.installments||[]).filter(i=>i.status==='paid').reduce((a,i)=>a+Number(i.amount||0),0))
            });
          } else {
            // اگر هیچ طرحی وجود نداشته باشد، state را بازنشانی کن
            setBnpl({ paid: 0, total: 0, nextDue: '-', remaining: 0 });
          }
        }
      } catch (_) {}
      try {
        const a = await fetch(`${BASE_API}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } });
        const ad = await a.json();
        if (a.ok && ad?.addresses) setAddresses(ad.addresses);
      } catch (_) {}
    })();
    // init notify flag from localStorage
    try { if (typeof window !== 'undefined') setNotifyOn(localStorage.getItem('bnpl_notify') === '1'); } catch(_){ }
    return () => { cancelled = true; };
  }, []);

  function daysDiffFromToday(dateStr){
    try {
      const d = new Date(dateStr);
      const now = new Date();
      d.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      const diff = Math.round((d.getTime() - now.getTime())/86400000);
      return diff;
    } catch { return 0; }
  }

  async function handlePayInstallment(planId, index){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) return toast.error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/bnpl/${planId}/pay`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ index }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error||'پرداخت قسط ناموفق بود');
      toast.success('قسط پرداخت شد');
      const r = await fetch(`${BASE_API}/api/bnpl/my-plans`, { headers: { Authorization: `Bearer ${token}` } });
      const dj = await r.json();
      if (r.ok && Array.isArray(dj?.plans)) setBnplPlans(dj.plans);
    }catch(e){ toast.error(e.message||'خطا'); }
  }

  // Derived helpers for quick-cards
  function getDefaultAddress(){
    const def = (addresses||[]).find(a=>a.isDefault);
    if (def) return def;
    return (addresses||[])[0] || null;
  }
  function getNextDueInstallment(){
    let candidate = null;
    (bnplPlans||[]).forEach(pl => {
      (pl.installments||[]).forEach((ins, idx) => {
        if (ins.status === 'paid') return;
        const d = ins.dueDate ? new Date(ins.dueDate) : null;
        if (!d) return;
        if (!candidate || d < candidate.dueDate) {
          candidate = { amount: Number(ins.amount||0), dueDate: d, index: idx, planId: pl._id };
        }
      });
    });
    return candidate;
  }
  function getLastPaidInstallment(){
    let last = null;
    (bnplPlans||[]).forEach(pl => {
      (pl.installments||[]).forEach((ins) => {
        if (ins.status !== 'paid' || !ins.paidAt) return;
        const p = new Date(ins.paidAt);
        if (!last || p > last.paidAt) {
          last = { amount: Number(ins.amount||0), paidAt: p };
        }
      });
    });
    return last;
  }

  // Recalculate BNPL summary when plans change
  useEffect(()=>{
    if (!Array.isArray(bnplPlans) || bnplPlans.length===0) return;
    let totalInstallments = 0;
    let paidInstallments = 0;
    let remainingAmount = 0;
    let nextDueDate = null;
    bnplPlans.forEach(pl => {
      const insts = pl.installments||[];
      totalInstallments += insts.length;
      paidInstallments += insts.filter(i=>i.status==='paid').length;
      const paidSum = insts.filter(i=>i.status==='paid').reduce((a,i)=>a+Number(i.amount||0),0);
      remainingAmount += Math.max(0, Number(pl.totalAmount||0) - paidSum);
      const next = insts.find(i=>i.status!=='paid');
      if (next && next.dueDate) {
        const d = new Date(next.dueDate);
        if (!nextDueDate || d < nextDueDate) nextDueDate = d;
      }
    });
    setBnpl({
      paid: paidInstallments,
      total: totalInstallments,
      nextDue: nextDueDate ? formatJalaliDate(nextDueDate) : '-',
      remaining: remainingAmount
    });
  }, [bnplPlans]);

  // Notifications for upcoming/overdue installments
  function notify(title, body){
    try{
      if (typeof window === 'undefined') return;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else {
        toast(body);
      }
    }catch(_){ toast(body); }
  }

  useEffect(()=>{
    if (!notifyOn) return;
    // ask permission once
    try { if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch(_){ }
    const timer = setInterval(()=>{
      try{
        const plans = bnplPlans||[];
        plans.forEach(pl => {
          (pl.installments||[]).forEach((ins, idx) => {
            if (ins.status === 'paid') return;
            if (!ins.dueDate) return;
            const days = daysDiffFromToday(ins.dueDate);
            // Notify for today, overdue (up to 3 days), or within next 3 days
            if (days === 0 || (days > 0 && days <= 3) || (days < 0 && days >= -3)) {
              const key = `bnpl_notified_${pl._id}_${idx}`;
              const last = (typeof window !== 'undefined') ? localStorage.getItem(key) : null;
              const marker = String(days);
              if (last === marker) return;
              const title = days===0 ? 'موعد پرداخت امروز' : (days>0 ? `موعد پرداخت ${days} روز دیگر` : `${Math.abs(days)} روز از موعد گذشته`);
              const body = `قسط ${idx+1} - مبلغ ${Number(ins.amount||0).toLocaleString()} تومان`;
              notify(title, body);
              try { if (typeof window !== 'undefined') localStorage.setItem(key, marker); } catch(_){ }
            }
          });
        });
      }catch(_){ }
    }, 60000); // check each 60s
    return ()=>clearInterval(timer);
  }, [notifyOn, bnplPlans]);

  function handleDeleteAddress(id) {
    (async()=>{
      try {
        const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (!token) throw new Error('ابتدا وارد شوید');
        const res = await fetch(`${BASE_API}/api/addresses/${id}`, { method:'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const ct = res.headers.get('content-type') || '';
        const d = ct.includes('application/json') ? await res.json() : { error: await res.text() };
        if (!res.ok) throw new Error(d?.error||'خطا در حذف آدرس');
        setAddresses(addresses.filter(a => a._id !== id));
        toast.success("آدرس با موفقیت حذف شد.");
      } catch (e) { toast.error(e.message||'خطا'); }
    })();
  }

  async function handleSaveName() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/auth/me`, { method:'PUT', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ name: nameInput }) });
      const ct = res.headers.get('content-type') || '';
      const d = ct.includes('application/json') ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(d?.error||'خطا در ذخیره نام');
      setUserInfo(prev => ({ ...prev, name: d.user?.name || nameInput }));
      if (typeof window !== 'undefined') localStorage.setItem('user_name', d.user?.name || nameInput);
      setEditingName(false);
      toast.success('نام ذخیره شد');
    } catch (e) { toast.error(e.message||'خطا'); }
  }

  async function handleEditAddressSave() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/addresses/${editingAddressId}`, { method:'PUT', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ line: addressInput }) });
      const ct = res.headers.get('content-type') || '';
      const d = ct.includes('application/json') ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(d?.error||'خطا در ویرایش آدرس');
      setAddresses(prev => prev.map(a => a._id === editingAddressId ? d.address : a));
      setEditingAddressId(null);
      setAddressInput('');
      toast.success('آدرس ویرایش شد');
    } catch (e) { toast.error(e.message||'خطا'); }
  }

  async function handleSetDefault(id) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/addresses/${id}`, { method:'PUT', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ isDefault: true }) });
      const ct = res.headers.get('content-type') || '';
      const d = ct.includes('application/json') ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(d?.error||'خطا در تنظیم پیش‌فرض');
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
      toast.success('به عنوان آدرس پیش‌فرض تنظیم شد');
    } catch (e) { toast.error(e.message||'خطا'); }
  }

  if (!authChecked) {
    return (
      <div className="account-root" style={{ textAlign:'center', padding:'40px 0' }}>
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="account-root" style={{ textAlign:'center', padding:'40px 0' }}>
        <h2 className="account-title"><span className="account-icon">👤</span> پنل کاربری</h2>
        <div className="account-box">
          برای مشاهده حساب کاربری خود وارد شوید.
          <div style={{ marginTop: 12 }}>
            <a href="/login" className="address-add-btn" style={{ textDecoration:'none' }}>ورود</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-root">
      <h2 className="account-title">
        <span className="account-icon">👤</span> پنل کاربری
      </h2>
      <div className="account-hero">
        <div className="hero-greet">
          <div className="hero-line1">سلام{userInfo?.name? `، ${userInfo.name}`:''} 👋</div>
          <div className="hero-line2">به حساب کاربری خوش آمدی</div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hs-top">سفارش‌ها</div>
            <div className="hs-num">{ordersTotal}</div>
          </div>
          <div className="hero-stat">
            <div className="hs-top">کیف پول</div>
            <div className="hs-num">{wallet.balance.toLocaleString()}<span className="hs-unit">تومان</span></div>
          </div>
          <div className="hero-stat">
            <div className="hs-top">اقساط باقی</div>
            <div className="hs-num">{bnpl.total > 0 ? bnpl.total - bnpl.paid : '-'}</div>
          </div>
          <div className="hero-stat">
            <div className="hs-top">آخرین قسط</div>
            <div className="hs-num">{(()=>{ const lp=getLastPaidInstallment(); return lp? `${Number(lp.amount).toLocaleString()}`:'-'; })()}<span className="hs-unit">{getLastPaidInstallment()? 'تومان':''}</span></div>
          </div>
          <div className="hero-stat">
            <div className="hs-top">موعد پرداخت قسط بعدی</div>
            <div className="hs-num">{(()=>{ const nd=getNextDueInstallment(); return nd? formatJalaliDate(nd.dueDate):'-'; })()}</div>
          </div>
        </div>
      </div>
      <div style={{ textAlign:'center', marginBottom: 12 }}>
        <button
          onClick={async()=>{
            try {
              // ابتدا سبد را پاک می‌کنیم
              try { if (typeof window !== 'undefined') localStorage.removeItem('cart'); } catch(_) {}
              await fetch(`${BASE_API}/api/auth/logout`, { method:'POST', credentials:'include' });
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_phone');
                localStorage.removeItem('user_name');
              }
              // پاک‌سازی سبد خرید ذخیره‌شده
              try { if (typeof window !== 'undefined') localStorage.removeItem('cart'); } catch(_) {}
              toast.success('خروج انجام شد');
              // رفرش خودکار برای همگام شدن هدر و وضعیت کاربر
              if (typeof window !== 'undefined') window.location.reload();
            } catch (_) { toast.error('خطا در خروج'); }
          }}
          className="address-add-btn"
          style={{ background:'var(--accent)', padding:'8px 16px' }}
        >
          خروج از حساب
        </button>
      </div>

      {/* اطلاعات کاربر */}
      <div className="account-box account-info">
        <div className="info-row">
          <span className="info-label">نام:</span>
          {!editingName ? (
            <>
              <span className="info-value">{userInfo.name || '-'}</span>
              <button className="address-add-btn" style={{ marginRight: 8 }} onClick={()=>{ setEditingName(true); setNameInput(userInfo.name||''); }}>ویرایش</button>
            </>
          ) : (
            <>
              <input value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="نام و نام خانوادگی" className="address-input" style={{ maxWidth: 240 }} />
              <button className="address-add-btn" style={{ marginRight: 8 }} onClick={handleSaveName}>ذخیره</button>
              <button className="address-delete-btn" onClick={()=>{ setEditingName(false); setNameInput(''); }}>انصراف</button>
            </>
          )}
        </div>
        <div className="info-row" style={{ marginTop: 6 }}>
          <span className="info-label">شماره موبایل:</span>
          <span className="info-value">{userPhone}</span>
        </div>
      </div>

      {/* سفارش‌ها */}
      <div className="account-box account-orders">
        <h3 className="section-title">📦 سفارش‌های من</h3>
        {orders.length === 0 ? (
          <div className="empty-text">هنوز سفارشی ثبت نکرده‌اید.</div>
        ) : (
          <>
            {orders.slice(0,3).map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <span className="order-id">{order.orderNumber || order._id}</span>
                  <span className={`order-status ${order.status === 'delivered' || order.status==='paid' ? 'order-success' : 'order-warn'}`}>
                    {statusFa[order.status] || order.status}
                  </span>
                </div>
                <div className="order-compact">
                  <span className="order-date">🗓 {new Date(order.createdAt).toLocaleDateString('fa-IR')}</span>
                  <span className="order-total-mini">مبلغ: {Number(order.totalPrice||0).toLocaleString()} تومان</span>
                  <button className="order-details-btn" onClick={()=>setExpandedOrders(prev=>({ ...prev, [order._id]: !prev[order._id] }))}>
                    {expandedOrders[order._id] ? 'بستن جزئیات' : 'جزئیات سفارش'}
                  </button>
                </div>
                {expandedOrders[order._id] && (
                  <div className="order-details">
                    <div className="od-row"><span>روش پرداخت:</span> <b>{order.paymentMethod==='bnpl' ? 'اعتباری' : (order.paymentMethod==='cod'?'در محل':'آنلاین')}</b></div>
                    <div className="od-row"><span>بازه تحویل:</span> <b>{order.deliverySlot || '-'}</b></div>
                    <div className="od-row"><span>آدرس:</span> <b>{order.address||'-'}</b></div>
                    <div className="od-row"><span>منطقه:</span> <b>{order.region||'-'}</b> <span style={{marginRight:8}}>پلاک:</span> <b>{order.plaque||'-'}</b> <span style={{marginRight:8}}>واحد:</span> <b>{order.unit||'-'}</b></div>
                    <div className="od-items">
                      {(order.products||[]).map((op, idx) => (
                        <div key={op.product?._id||idx} className="od-item">
                          <span>{op.product?.name||'کالا'}</span>
                          <span>× {op.quantity}</span>
                          <span>{(Number(op.price||0) * Number(op.quantity||0)).toLocaleString()} تومان</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-total">جمع کل: <span>{Number(order.totalPrice||0).toLocaleString()} تومان</span></div>
                  </div>
                )}
              </div>
            ))}
            <div style={{textAlign:'center',marginTop:10}}>
              <a className="address-add-btn" href="/orders">مشاهده همه سفارش‌ها</a>
            </div>
          </>
        )}
      </div>

      {/* کیف پول */}
      <div className="account-box account-wallet">
        <h3 className="section-title">💳 کیف پول</h3>
        <div className="wallet-info">
          موجودی:
          <span className="wallet-balance">
            {wallet.balance.toLocaleString()} تومان
          </span>
        </div>
        <button className="wallet-btn" onClick={async()=>{
          try {
            const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
            if (!token) return toast.error('لطفاً ابتدا وارد شوید');
            const amount = Number(prompt('مبلغ واریز (تومان):','50000'))||0;
            if (!amount) return;
            const res = await fetch(`${BASE_API}/api/wallet/deposit`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount, ref: 'manual' }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'خطا در واریز');
            setWallet({ balance: Number(data.wallet.balance)||0 });
            toast.success('واریز موفق بود');
          } catch (e) { toast.error(e.message||'خطا'); }
        }}>
          واریز وجه
        </button>
      </div>

      {/* آدرس‌ها */}
      <div className="account-box account-addresses">
        <h3 className="section-title">📍 آدرس‌های من</h3>
        {addresses.length === 0 ? (
          <div className="empty-text">هنوز آدرسی ثبت نکرده‌اید.</div>
        ) : (
          addresses.map((a) => (
            <div key={a._id} className="address-row">
              {editingAddressId === a._id ? (
                <>
                  <input className="address-input" value={addressInput} onChange={e=>setAddressInput(e.target.value)} />
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="address-add-btn" onClick={handleEditAddressSave}>ذخیره</button>
                    <button className="address-delete-btn" onClick={()=>{ setEditingAddressId(null); setAddressInput(''); }}>انصراف</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="address-text">{a.line}{a.isDefault ? ' (پیش‌فرض)' : ''}</span>
                  <div style={{ display:'flex', gap:6 }}>
                    {!a.isDefault && <button className="address-add-btn" onClick={()=>handleSetDefault(a._id)}>پیش‌فرض</button>}
                    <button className="address-add-btn" onClick={()=>{ setEditingAddressId(a._id); setAddressInput(a.line||''); }}>ویرایش</button>
                    <button className="address-delete-btn" onClick={() => handleDeleteAddress(a._id)}>حذف</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <form onSubmit={handleAddAddress} className="address-form">
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder="آدرس جدید"
            className="address-input"
          />
          <button type="submit" className="address-add-btn">
            ثبت آدرس
          </button>
        </form>
      </div>

      {/* BNPL */}
      <div className="account-box account-bnpl">
        <h3 className="section-title">💸 خرید اعتباری (BNPL)</h3>
        <div className="bnpl-row" style={{justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span>اعلان سررسید اقساط:</span>
            <label style={{display:'flex',alignItems:'center',gap:6}}>
              <input type="checkbox" checked={notifyOn} onChange={e=>{ setNotifyOn(e.target.checked); try{ if (typeof window !== 'undefined') localStorage.setItem('bnpl_notify', e.target.checked?'1':'0'); }catch(_){ } }} />
              فعال
            </label>
          </div>
        </div>
        {bnpl.total > 0 ? (
          <>
            <div className="bnpl-row">
              <span>اقساط پرداخت‌شده:</span>
              <b>{bnpl.paid}</b> / <b>{bnpl.total}</b>
            </div>
            <div className="bnpl-row">
              <span>مبلغ باقی‌مانده:</span>
              <span className="bnpl-amount">{bnpl.remaining.toLocaleString()} تومان</span>
            </div>
          </>
        ) : (
          <div className="bnpl-row">
            <span style={{color: '#666', fontStyle: 'italic'}}>سفارش خرید اعتباری ندارید</span>
          </div>
        )}
        {bnpl.total > 0 && (
          <div className="bnpl-row">
            <span>تاریخ سررسید قسط بعدی:</span>
            <b>{bnpl.nextDue}</b>
          </div>
        )}
        {(bnplPlans||[]).length>0 ? (
          <div className="bnpl-plans">
            {bnplPlans.map((pl,pi)=>{
              const paidCount = (pl.installments||[]).filter(i=>i.status==='paid').length;
              return (
                <div key={pl._id||pi} className="bnpl-plan-card">
                  <div className="bnpl-plan-header">
                    <div>سفارش: <b>{pl.order?.orderNumber||pl.order?._id||'-'}</b></div>
                    <div>پرداخت‌شده: <b>{paidCount}</b>/<b>{(pl.installments||[]).length}</b></div>
                    <div>مجموع: <b>{Number(pl.totalAmount||0).toLocaleString()} تومان</b></div>
                  </div>
                  <div className="bnpl-insts">
                    {(pl.installments||[]).map((ins, idx)=>{
                      const due = ins.dueDate ? new Date(ins.dueDate) : null;
                      const days = ins.dueDate ? daysDiffFromToday(ins.dueDate) : 0;
                      const isPaid = ins.status==='paid';
                      const label = due ? formatJalaliDate(due) : '-';
                      const counter = days===0 ? 'امروز سررسید' : (days>0 ? `${days} روز مانده` : `${Math.abs(days)} روز گذشته`);
                      return (
                        <div key={idx} className={`inst-row ${isPaid?'paid':''}`}>
                          <div className="inst-col">
                            <div>قسط {idx+1}</div>
                            <div className="inst-date">تاریخ: {label}</div>
                          </div>
                          <div className="inst-col">
                            <div className="inst-amount">{Number(ins.amount||0).toLocaleString()} تومان</div>
                            <div className={`inst-counter ${days<0?'overdue': (days>0?'due':'today')}`}>{counter}</div>
                          </div>
                          <div className="inst-actions">
                            <button className="inst-pay-btn" disabled={isPaid} onClick={()=>handlePayInstallment(pl._id, idx)}>
                              {isPaid ? 'پرداخت شده' : 'پرداخت'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-text" style={{marginTop:8}}>طرح اعتباری فعالی ندارید.</div>
        )}
      </div>

      {/* استایل مدرن و ریسپانسیو */}
      <style>{`
        .account-root {
          max-width: 880px;
          margin: 34px auto;
          background: #f8fafc;
          border-radius: 22px;
          box-shadow: 0 8px 38px #e2e6ea;
          font-family: Vazirmatn,sans-serif;
          padding: 26px 16px;
        }
        .account-title {
          font-size: 2rem;
          font-weight: bold;
          color: var(--brand-purple-2,#663191);
          text-align: center;
          margin-bottom: 27px;
          letter-spacing: 1px;
        }
        .account-hero{display:flex;justify-content:space-between;gap:12px;align-items:center;background:linear-gradient(90deg,var(--brand-purple-1,#7156A5) 0%,var(--brand-orange-2,#F26826) 100%);border:1px solid #e7f5ee;border-radius:16px;padding:14px 16px;margin-bottom:16px;color:#fff}
        .hero-greet{display:flex;flex-direction:column;gap:6px}
        .hero-line1{font-weight:800;font-size:1.1rem}
        .hero-line2{font-weight:600}
        .hero-stats{display:flex;gap:10px;flex-wrap:wrap}
        .hero-stat{background:#fff;border:1px solid #e6f2ec;border-radius:12px;padding:8px 12px;min-width:110px;text-align:center}
        .hs-top{font-size:12px;color:#6b9080}
        .hs-num{font-weight:900;color:var(--brand-purple-2,#663191);font-size:1.1rem}
        .hs-unit{font-weight:600;color:#6b9080;margin-right:4px;font-size:12px}
        .account-icon {
          font-size: 2rem;
          margin-left: 7px;
        }
        .account-box {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 18px #eee;
          margin-bottom: 24px;
          padding: 22px 18px;
          transition: box-shadow .2s;
        }
        .account-box:hover { box-shadow: 0 6px 28px #e2e6ea; }
        .info-row {
          display: flex;
          gap: 8px;
          font-size: 1.08rem;
          color: #444;
        }
        .info-label { color: var(--brand-purple-2,#663191); font-weight: bold; }
        .section-title { font-size: 1.2rem; font-weight: bold; color: var(--brand-orange-2,#F26826); margin-bottom: 15px; display:flex; align-items:center; gap:4px }
        .empty-text {
          color: #b0b0b0;
          font-size: 0.95rem;
          text-align: center;
          margin-bottom: 10px;
        }
        /* سفارش‌ها */
        .order-card {
          background: #f8f8ff;
          border-radius: 9px;
          box-shadow: 0 2px 10px #e0e0e0;
          margin-bottom: 14px;
          padding: 15px 12px 10px 12px;
          transition: box-shadow 0.2s;
        }
        .order-card:hover { box-shadow: 0 6px 26px #e2e6ea; }
        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .order-id { font-weight: bold; color: var(--brand-purple-2,#663191); letter-spacing: 1px; }
        .order-status {
          font-weight: bold;
          font-size: 15px;
          padding: 2px 14px;
          border-radius: 8px;
        }
        .order-success { color: #fff; background: var(--brand-purple-2,#663191); }
        .order-warn { color: #fff; background: var(--brand-orange-2,#F26826); }
        .order-meta {
          display: flex;
          gap: 14px;
          margin-bottom: 5px;
          font-size: 14px;
          color: #888;
        }
        .order-compact{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:6px}
        .order-total-mini{color: var(--brand-orange-2,#F26826); font-weight:700}
        .order-details-btn{background:#fff;border:1px solid #e6f2ec;border-radius:8px;padding:6px 10px;cursor:pointer;color:#2d6a4f;font-weight:700}
        .order-details{background:#fff;border:1px solid #e6f2ec;border-radius:10px;padding:8px 10px;margin-top:6px}
        .od-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;color:#2d6a4f}
        .od-items{display:flex;flex-direction:column;gap:6px;margin-top:6px}
        .od-item{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed #eef5f1;padding-bottom:4px}
        .order-items {
          margin-top: 6px;
          color: #222;
          font-size: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .order-item {
          display: flex;
          align-items: center;
        }
        .order-price { margin-right: 3px; color: var(--brand-orange-2,#F26826); }
        .order-dot {
          margin: 0 6px;
          color: #b0b0b0;
        }
        .order-total { font-weight: bold; color: var(--brand-purple-2,#663191); font-size: 1.05rem; margin-top: 4px; background: #f5f0ff; border-radius: 7px; padding: 3px 11px; display: inline-block; }
        /* کیف پول */
        .wallet-info {
          font-size: 1.07rem;
          color: #444;
          margin-bottom: 11px;
        }
        .wallet-balance { color: var(--brand-orange-2,#F26826); font-size:1.14rem; margin-right:8px; font-weight:bold }
        .wallet-btn { background: linear-gradient(90deg,var(--brand-orange-2,#F26826) 60%, var(--brand-orange-1,#FBAD1B) 100%);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 10px 26px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 1px 6px #e2e2e2;
          transition: background .2s;
        }
        .wallet-btn:hover { background: linear-gradient(90deg,#d35400 60%,#f39c12 100%); }
        /* آدرس‌ها */
        .address-row {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 8px 13px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 6px #f0f0f0;
        }
        .address-text {
          font-size: 15px;
          color: #222;
        }
        .address-delete-btn { background: var(--brand-purple-2,#663191);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 4px 13px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
        }
        .address-delete-btn:hover {
          background: var(--brand-purple-1,#7156A5);
        }
        .address-form {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .address-input {
          flex: 1;
          padding: 9px 15px;
          border-radius: 7px;
          border: 1px solid #ddd;
          font-size: 15px;
          background: #f5f5f5;
          transition: border-color .2s;
        }
        .address-input:focus {
          border-color: var(--brand-purple-2,#663191);
          background: #f5f0ff;
        }
        .address-add-btn {
          background: var(--brand-orange-2,#F26826);
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 9px 17px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 2px 8px #e3e3e3;
          transition: background .2s;
        }
        .address-add-btn:hover {
          background: var(--brand-orange-1,#FBAD1B);
        }
        /* BNPL */
        .account-bnpl {
          background: linear-gradient(90deg,#f5f0ff 70%,#f8fafc 100%);
          border: 1.5px dashed var(--brand-purple-2,#663191);
        }
        .bnpl-row {
          font-size: 1.02rem;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .bnpl-amount { color: var(--brand-orange-2,#F26826); font-weight: bold; }
        .bnpl-plans { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
        .bnpl-plan-card { background:#fff; border:1px solid #e6f2ec; border-radius:10px; padding:10px }
        .bnpl-plan-header { display:flex; flex-wrap:wrap; gap:12px; color:#2d6a4f; font-weight:600; margin-bottom:8px }
        .bnpl-insts { display:flex; flex-direction:column; gap:8px }
        .inst-row { display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px solid #eef5f1; border-radius:8px; padding:8px 10px; background:#f8fffb }
        .inst-row.paid { opacity:.55; background:#f4f6f5 }
        .inst-col { display:flex; flex-direction:column; gap:4px; min-width:120px }
        .inst-date { color:#777; font-size:12px }
        .inst-amount { color: var(--brand-purple-2,#663191); font-weight:700 }
        .inst-counter { font-size:12px; font-weight:600 }
        .inst-counter.overdue { color: var(--brand-orange-2,#F26826) }
        .inst-counter.due { color: var(--brand-purple-1,#7156A5) }
        .inst-counter.today { color: var(--brand-orange-1,#FBAD1B) }
        .inst-actions { min-width:96px; display:flex; justify-content:flex-end }
        .inst-pay-btn { background: var(--brand-orange-2,#F26826); color:#fff; border:none; border-radius:8px; padding:7px 12px; font-weight:700; cursor:pointer; box-shadow:0 1px 6px #e2e2e2 }
        .inst-pay-btn:disabled { background:#9dc1b0; cursor:not-allowed }

        /* ریسپانسیو */
        @media (max-width: 900px) {
          .account-root {
            padding: 13px 3px;
          }
          .account-title {
            font-size: 1.3rem;
          }
          .account-box {
            padding: 16px 7px;
          }
          .section-title {
            font-size: 1rem;
          }
        }
        @media (max-width: 600px) {
          .account-root {
            padding: 4px 0;
          }
          .account-title {
            font-size: 1.1rem;
          }
          .account-box {
            margin-bottom: 19px;
            padding: 11px 3px;
          }
          .order-card {
            padding: 7px 2px 7px 2px;
          }
          .wallet-btn, .address-add-btn {
            font-size: 12px;
            padding: 8px 13px;
          }
          .address-input {
            font-size: 12px;
            padding: 7px 9px;
          }
          .address-row {
            padding: 7px 2px;
          }
          .bnpl-row {
            font-size: 0.96rem;
          }
        }
        @media (max-width: 400px) {
          .address-form {
            flex-direction: column;
            gap: 5px;
          }
          .address-input, .address-add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
'use client';

import React, { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useEffect } from "react";

const BASE_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const CHECKOUT_DRAFT_KEY = 'checkout_draft_v1';
const CHECKOUT_DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// دمو: هزینه ارسال
const DELIVERY_FEE = 35000;
const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 500000);

// دمو: مناطق ارسال
const REGIONS = ["منطقه 1", "منطقه 2", "منطقه 3", "منطقه 4", "منطقه 5"];

// دمو: بازه‌های زمانی تحویل
const TIME_SLOTS = [
  "8 تا 9",
  "9 تا 10",
  "10 تا 11",
  "11 تا 12",
  "12 تا 13",
  "13 تا 14",
  "14 تا 15",
  "15 تا 16",
  "16 تا 17",
  "17 تا 18",
];

function getNext7DaysISO() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({ label: d.toLocaleDateString("fa-IR"), value: d.toISOString(), dateObj: d });
  }
  return days;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  const categoriesInCart = useMemo(() => Array.from(new Set(cart.map(i => i.category).filter(Boolean))), [cart]);
  const hasBread = useMemo(() => cart.some(i => (i.category||'').includes('نان')), [cart]);

  const days = useMemo(() => getNext7DaysISO(), []);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    payment: "online",
    coupon: "",
    address: "",
    plaque: "",
    unit: "",
    region: "",
  });
  const [draftRestored, setDraftRestored] = useState(false);
  // ذخیره/بازیابی خودکار انتخاب‌ها (تاریخ/بازه/منطقه)
  useEffect(()=>{
    try {
      const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('checkout_sel')||'{}') : {};
      const next = { ...form };
      if (saved.date && days.some(d=>d.value===saved.date)) next.date = saved.date;
      if (saved.time && TIME_SLOTS.includes(saved.time)) next.time = saved.time;
      if (saved.region && (regions||REGIONS).includes(saved.region)) next.region = saved.region;
      setForm(next);
    } catch(_){}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('checkout_sel', JSON.stringify({ date: form.date, time: form.time, region: form.region }));
      }
    } catch(_){}
  }, [form.date, form.time, form.region]);

  // Restore full draft (entire form) on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || !parsed.form) return;
      if (Date.now() - Number(parsed.ts) > CHECKOUT_DRAFT_TTL_MS) {
        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
        return;
      }
      setForm(prev => ({ ...prev, ...parsed.form }));
      setDraftRestored(true);
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist full draft on change (lightweight)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ ts: Date.now(), form }));
    } catch (_) {}
  }, [form]);
  const [regions, setRegions] = useState(REGIONS);
  const [regionFees, setRegionFees] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paid, setPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [payments, setPayments] = useState({
    online: true,
    cod: true,
    bnpl: true,
  });
  const [dailyHours, setDailyHours] = useState([]);
  const [bnplServerBlocked, setBnplServerBlocked] = useState(false);
  const [bnplCartBlocked, setBnplCartBlocked] = useState(false);
  const [bnplMsg, setBnplMsg] = useState("");
  const [showBnplInfo, setShowBnplInfo] = useState(false);
  const [bnplLimits, setBnplLimits] = useState({ min: 700000, max: 2000000 });
  const bnplBlocked = bnplServerBlocked || bnplCartBlocked;
  const dateLabel = useMemo(() => {
    const found = days.find(d => d.value === form.date);
    try { return found ? found.label : new Date(form.date).toLocaleDateString('fa-IR'); } catch(_) { return found?.label || ''; }
  }, [form.date, days]);
  
  

  // انتخاب‌ها فقط از طریق کارت‌های میانی انجام می‌شود؛ مودال‌ها حذف شدند

  const selectedRegion = regions[0];
  const regionFee = Number(regionFees[form.region || selectedRegion] || DELIVERY_FEE);
  const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : regionFee;
  const finalAmount = Math.max(0, cartTotal + shippingFee - discount);
  const itemsSubtotal = cartTotal;
  const showBnplInstallmentExample = payments.bnpl && itemsSubtotal >= bnplLimits.min && itemsSubtotal <= bnplLimits.max;
  const enabledTimeSlots = useMemo(() => TIME_SLOTS.filter(t => isTimeSlotEnabled(t, form, hasBread, dailyHours)), [form.date, hasBread, dailyHours]);
  const enabledDays = useMemo(() => {
    return days.filter(d => {
      const tempForm = { ...form, date: d.value };
      return TIME_SLOTS.some(t => isTimeSlotEnabled(t, tempForm, hasBread, dailyHours));
    });
  }, [days, hasBread, dailyHours]);

  // (حفظ UI خالی) به‌جای انتخاب خودکار بازه/تاریخ، فقط در زمان ارسال از اولین مورد مجاز استفاده می‌کنیم

  const normalizeDigits = (input) => {
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    const ar = '٠١٢٣٤٥٦٧٨٩';
    return String(input || '')
      .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
      .replace(/[^0-9+]/g, '');
  };

  function isTimeSlotEnabled(slot, currentForm, hasBreadInCart, openingHours) {
    const match = /^(\d{1,2})\s*تا\s*(\d{1,2})$/.exec(slot);
    if (!match) return true;
    const slotStart = Number(match[1]);
    const selected = new Date(currentForm.date);
    const now = new Date();
    const minMinutes = hasBreadInCart ? 120 : 90;
    if (selected.toDateString() !== now.toDateString()) return true;
    const slotTime = new Date(selected);
    slotTime.setHours(slotStart, 0, 0, 0);
    const diffMin = (slotTime.getTime() - now.getTime()) / 60000;
    if (diffMin < minMinutes) return false;
    const day = selected.getDay();
    const wh = (openingHours || []).find(h => Number(h.day) === Number(day));
    if (!wh) return true;
    const [oH, oM] = String(wh.open || '0:0').split(':').map(Number);
    const [cH, cM] = String(wh.close || '23:59').split(':').map(Number);
    const openMinutes = oH * 60 + (oM || 0);
    const closeMinutes = cH * 60 + (cM || 0);
    const slotMinutes = slotStart * 60;
    return slotMinutes >= openMinutes && slotMinutes < closeMinutes;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'phone') {
      const normalized = normalizeDigits(value);
      setForm({ ...form, phone: normalized });
      return;
    }
    // BNPL eligibility check when selecting payment
    if (name === 'payment' && value === 'bnpl') {
      (async()=>{
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
          if (!token) throw new Error('برای پرداخت اعتباری وارد شوید.');
          const r = await fetch(`${BASE_API}/api/bnpl/eligibility`, { headers: { Authorization: `Bearer ${token}` } });
          const d = await r.json();
          if (!r.ok || !d.eligible) {
            let msg = 'شرایط استفاده از BNPL را ندارید.';
            if (d?.hasActivePlan) msg = 'شما یک طرح اعتباری فعال دارید. پس از تسویه امکان ثبت سفارش اعتباری جدید وجود دارد.';
            else if (d?.capReached) msg = 'به دلیل محدودیت منابع، خرید اعتباری موقتاً غیرفعال است.';
            setError(msg);
            return;
          }
          setForm({ ...form, [name]: value });
        } catch (e) {
          setError(e.message || 'عدم امکان BNPL');
        }
      })();
      return;
    }
    setForm({ ...form, [name]: value });
  }

  function selectDate(val) {
    setForm(prev => ({ ...prev, date: val }));
  }

  useEffect(() => {
    (async()=>{
      try {
        const r = await fetch(`${BASE_API}/api/settings`);
        const d = await r.json();
        if (r.ok && d?.settings) {
          setRegions(d.settings.deliveryZones.map(z => z.name));
          const fees = {};
          d.settings.deliveryZones.forEach(z => { fees[z.name] = z.fee; });
          setRegionFees(fees);
          const p = d.settings.payments || {};
          setPayments({ online: p.allowOnline !== false, cod: p.allowCOD !== false, bnpl: p.allowBNPL !== false });
          setDailyHours(d.settings.dailyHours || []);
          const bnpl = d.settings.bnpl || {};
          setBnplLimits({ min: Number(bnpl.minCartTotal||700000), max: Number(bnpl.maxCartTotal||2000000) });
        }
      } catch(_){ }

      // دریافت آدرس‌های کاربر و ست‌کردن پیش‌فرض
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (token) {
          const ar = await fetch(`${BASE_API}/api/addresses`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
          const ad = await ar.json();
          if (ar.ok && Array.isArray(ad.addresses)) {
            setAddresses(ad.addresses);
            const def = ad.addresses.find(a => a.isDefault) || ad.addresses[0];
            if (def) {
              setSelectedAddressId(def._id);
              setForm(prev => ({
                ...prev,
                address: def.line || prev.address,
                region: def.region || prev.region,
                plaque: def.plaque || prev.plaque,
                unit: def.unit || prev.unit,
              }));
            }
          }
        }
      } catch(_) {}
      // بررسی صلاحیت BNPL و وجود طرح فعال
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (token) {
          const er = await fetch(`${BASE_API}/api/bnpl/eligibility`, { headers: { Authorization: `Bearer ${token}` } });
          const ed = await er.json();
          if (er.ok) {
            if (!ed.eligible) {
              setBnplServerBlocked(true);
              if (ed.hasActivePlan) {
                setBnplMsg('شما یک طرح اعتباری فعال دارید. پس از تسویه می‌توانید مجدداً از BNPL استفاده کنید.');
              } else if (ed.capReached) {
                setBnplMsg('به دلیل محدودیت منابع، خرید اعتباری موقتاً غیرفعال است.');
              } else {
                const ordersCount = ed.ordersCount || 0;
                const remaining = Math.max(0, 2 - ordersCount);
                setBnplMsg(`برای استفاده از خرید اعتباری، ${remaining} سفارش موفق دیگر نیاز دارید. (${ordersCount}/2)`);
              }
            } else {
              setBnplServerBlocked(false);
              setBnplMsg('');
            }
          }
        } else {
          setBnplServerBlocked(true);
          setBnplMsg('برای استفاده از خرید اعتباری، ابتدا وارد حساب کاربری خود شوید.');
        }
      } catch(_) {}
    })();
  }, []);

  useEffect(()=>{
    const isBnplDisabled = bnplServerBlocked || bnplCartBlocked;
    if (isBnplDisabled && form.payment === 'bnpl') {
      setForm(prev => ({ ...prev, payment: 'online' }));
    }
  }, [bnplServerBlocked, bnplCartBlocked]);

  useEffect(()=>{
    // enforce bnpl by cart total client-side
    if (payments.bnpl) {
      if (itemsSubtotal < bnplLimits.min) {
        setBnplCartBlocked(true);
        if (!bnplServerBlocked) setBnplMsg(`حداقل مبلغ سبد برای خرید اعتباری ${bnplLimits.min.toLocaleString()} تومان است.`);
      } else if (itemsSubtotal > bnplLimits.max) {
        setBnplCartBlocked(true);
        if (!bnplServerBlocked) setBnplMsg(`حداکثر مبلغ سبد برای خرید اعتباری ${bnplLimits.max.toLocaleString()} تومان است.`);
      } else {
        setBnplCartBlocked(false);
        if (!bnplServerBlocked) setBnplMsg('');
      }
    }
  }, [itemsSubtotal, payments.bnpl, bnplLimits.min, bnplLimits.max, bnplServerBlocked]);

  // (حفظ UI خالی) دیگر بازه را به‌صورت خودکار در UI انتخاب نمی‌کنیم

  async function handleApplyCoupon() {
    if (!form.coupon) return;
    setCouponLoading(true);
    setError("");
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) {
        throw new Error('برای استفاده از کد تخفیف باید وارد شوید.');
      }
      const res = await fetch(`${BASE_API}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code: form.coupon, cartTotal, categories: categoriesInCart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'کد معتبر نیست');
      setAppliedCoupon(data.coupon);
      setDiscount(Number(data.discount) || 0);
    } catch (e) {
      setAppliedCoupon(null);
      setDiscount(0);
      setError(e.message || 'خطای کوپن');
    } finally {
      setCouponLoading(false);
    }
  }

  function validateFormState() {
    const requiredOk = Boolean(
      (form.name||'').trim() &&
      /^(?:09\d{9}|\+989\d{9})$/.test(form.phone||'') &&
      (form.date||'').trim() &&
      (form.time||'').trim() &&
      (form.region||'').trim() &&
      (form.address||'').trim() &&
      (form.region||'').trim() &&
      (form.time||'').trim() &&
      (form.date||'').trim() &&
      (form.plaque||'').trim() &&
      (form.unit||'').trim()
    );
    return requiredOk;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      if (!validateFormState()) {
        throw new Error('لطفاً همه فیلدهای الزامی (نام، موبایل، تاریخ، بازه، منطقه، آدرس، پلاک، واحد) را تکمیل کنید.');
      }
      // Fill missing name/phone from localStorage as a convenience
      try {
        if (!form.name && typeof window !== 'undefined') {
          const lsName = localStorage.getItem('user_name');
          if (lsName) setForm(prev => ({ ...prev, name: lsName }));
        }
        if (!form.phone && typeof window !== 'undefined') {
          const lsPhone = localStorage.getItem('user_phone');
          if (lsPhone) setForm(prev => ({ ...prev, phone: lsPhone }));
        }
      } catch(_) {}
      // validate cart
      const validate = await fetch(`${BASE_API}/api/products/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(i => ({ product: i.id, quantity: i.quantity, price: i.price })) })
      });
      const vr = await validate.json();
      if (!validate.ok || (vr.results && vr.results.some(r => !r.ok))) {
        throw new Error('قیمت/موجودی برخی اقلام تغییر کرده است. لطفاً سبد را بروزرسانی کنید.');
      }
      const payload = {
        products: cart.map(item => ({ product: item.id, quantity: item.quantity, price: item.price, category: item.category })),
        address: form.address,
        region: form.region,
        plaque: form.plaque,
        unit: form.unit,
        contactName: form.name,
        contactPhone: form.phone,
        deliveryDate: form.date,
        deliverySlot: form.time,
        deliveryFee: shippingFee,
        discount,
        paymentMethod: form.payment,
        coupon: appliedCoupon?.code,
      };
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "خطا در ثبت سفارش");
      setOrderId(data?.order?._id || "");
      try { if (typeof window !== 'undefined' && form.name) localStorage.setItem('user_name', form.name); } catch(_) {}
      
      // سبد خرید را در همه حالات خالی کن
      clearCart();
      
      // اگر آنلاین: هدایت به درگاه ماک
      if (form.payment === 'online') {
        // همیشه به صفحه پرداخت هدایت کن (چه کاربر وارد شده باشه چه نباشه)
        if (typeof window !== 'undefined') {
          window.location.href = `/checkout/payment?orderId=${encodeURIComponent(data?.order?._id)}&amount=${encodeURIComponent(finalAmount)}`;
        }
        return;
      }
      // غیر آنلاین: موفقیت و اقدامات تکمیلی
      setSuccess(true);
      if (form.payment === 'bnpl' && token) {
        try {
          await fetch(`${BASE_API}/api/bnpl/plan`, { method:'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: data?.order?._id, parts: 4 }) });
        } catch (_) {}
      }
    } catch (err) {
      setError(err.message || "خطای غیرمنتظره رخ داد");
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0 && !success) {
    return (
      <div className="checkout-empty">
        سبد خرید شما خالی است!
        <br />
        <Link href="/"><button className="checkout-back-btn">بازگشت به فروشگاه</button></Link>
        <style>{`
          .checkout-empty { max-width: 600px; margin: 60px auto; text-align: center; font-family: Vazirmatn,sans-serif; font-size: 19px; color: #888; }
          .checkout-back-btn { margin-top: 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 11px 38px; font-size: 17px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 12px #eee; transition: background .2s; }
          .checkout-back-btn:hover { background: var(--brand-orange-1,#FBAD1B); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkout-root">
      {!success ? (
        <>
          <h2 className="checkout-title"><span className="checkout-icon">📝</span>تکمیل اطلاعات و ثبت سفارش</h2>
          <div className="checkout-grid">
            
            <div className="checkout-main">
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <label>نام و نام خانوادگی:</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="مثلاً علی رضایی" required />
            </div>
            <div className="form-row">
              <label>شماره موبایل:</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="0912xxxxxxx" inputMode="numeric" pattern="^(?:09\\d{9}|\\+989\\d{9})$" onInvalid={(e)=>e.currentTarget.setCustomValidity('شماره موبایل را به‌صورت صحیح وارد کنید (مثال: 09121234567 یا +989121234567)')} onInput={(e)=>e.currentTarget.setCustomValidity('')} />
              {form.phone && !/^(?:09\d{9}|\+989\d{9})$/.test(form.phone) && (
                <div style={{ color:'var(--brand-purple-2,#663191)', fontSize:13, marginTop:6 }}>شماره موبایل را به‌صورت صحیح وارد کنید (مثال: 09121234567)</div>
              )}
            </div>
            <div className="triple-row">
              <div className="triple-card"> 
                <label>تاریخ دریافت سفارش</label>
                <select aria-label="انتخاب تاریخ دریافت سفارش" value={form.date} onChange={(e)=> selectDate(e.target.value)}>
                  <option value="" disabled>انتخاب تاریخ...</option>
                  {enabledDays.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="triple-card">
                <label>بازه زمانی</label>
                <select aria-label="انتخاب بازه زمانی" value={form.time} onChange={(e)=> { setForm({ ...form, time: e.target.value }); }}>
                  <option value="" disabled>انتخاب بازه...</option>
                  {enabledTimeSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="hint-muted">{`برای امروز، انتخاب بازه حداقل ${hasBread? '۱۲۰' : '۹۰'} دقیقه بعد امکان‌پذیر است.`}</div>
              </div>
              <div className="triple-card">
                <label>منطقه ارسال</label>
                <select aria-label="انتخاب منطقه ارسال" value={form.region} onChange={(e)=> { setForm({ ...form, region: e.target.value }); }}>
                  <option value="" disabled>انتخاب منطقه...</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r} — {Number(regionFees[r] || regionFee).toLocaleString()} تومان</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>روش پرداخت:</label>
              <div className="pay-methods">
                <label className={`pm ${form.payment==='online'?'active':''}`}>
                  <input type="radio" name="payment" value="online" checked={form.payment==='online'} onChange={handleChange} />
                  پرداخت آنلاین
                </label>
                {payments.cod && (
                  <label className={`pm ${form.payment==='cod'?'active':''}`}>
                    <input type="radio" name="payment" value="cod" checked={form.payment==='cod'} onChange={handleChange} />
                    پرداخت در محل
                  </label>
                )}
                {payments.bnpl && (
                  <label className={`pm ${form.payment==='bnpl'?'active':''}`}>
                    <input type="radio" name="payment" value="bnpl" checked={form.payment==='bnpl'} onChange={handleChange} disabled={bnplBlocked} />
                    اعتباری (BNPL)
                    {bnplBlocked && bnplMsg && (<span style={{color:'var(--brand-purple-2,#663191)',fontSize:12,marginRight:6}}>— {bnplMsg}</span>)}
                  </label>
                )}
                
                {/* دکمه نمایش توضیحات خرید اعتباری */}
                {payments.bnpl && (
                  <div className="bnpl-toggle-section">
                    <button 
                      type="button"
                      className={`bnpl-toggle-btn ${showBnplInfo ? 'open' : ''}`}
                      onClick={() => setShowBnplInfo(!showBnplInfo)}
                    >
                      <span className="bnpl-toggle-icon">💡</span>
                      <span>شرایط و ویژگی‌های خرید اعتباری (BNPL)</span>
                      <span className={`bnpl-arrow ${showBnplInfo ? 'open' : ''}`}>▼</span>
                    </button>
                    
                    {showBnplInfo && (
                      <div className="bnpl-info-content">
                        <div className="bnpl-features">
                          <h4>🌟 ویژگی‌های خرید اعتباری:</h4>
                          <ul>
                            <li>تقسیم مبلغ سفارش به <strong>4 قسط ماهانه</strong> بدون سود</li>
                            <li>پرداخت قسط اول همزمان با ثبت سفارش</li>
                            <li>3 قسط باقی‌مانده در ماه‌های آینده</li>
                            <li>بدون نیاز به ضامن یا وثیقه</li>
                            <li>یادآوری خودکار تاریخ سررسید اقساط</li>
                          </ul>
                        </div>
                        
                        <div className="bnpl-conditions">
                          <h4>📋 شرایط احراز واجد بودن:</h4>
                          <ul>
                            <li>
                              حداقل مبلغ سبد: <strong>{bnplLimits.min.toLocaleString()}</strong> تومان —
                              حداکثر مبلغ سبد: <strong>{bnplLimits.max.toLocaleString()}</strong> تومان
                            </li>
                            <li>عضویت فعال در سایت و ورود به حساب کاربری</li>
                            <li>داشتن حداقل <strong>2 سفارش موفق</strong> قبلی (پرداخت شده یا تحویل داده شده)</li>
                            <li>عدم وجود طرح اعتباری فعال دیگر</li>
                            <li>حسن سابقه در پرداخت اقساط قبلی (در صورت وجود)</li>
                          </ul>
                        </div>
                        
                        {bnplBlocked && (
                          <div className="bnpl-blocked-reason">
                            <h4>❌ علت عدم دسترسی به خرید اعتباری:</h4>
                            <div className="blocked-reason-content">
                              {(() => {
                                const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
                                if (!token) {
                                  return (
                                    <p>برای استفاده از خرید اعتباری، ابتدا <strong>وارد حساب کاربری</strong> خود شوید. 
                                    بعد از ورود، سیستم تاریخچه خریدهای شما را بررسی کرده و در صورت داشتن شرایط، 
                                    گزینه خرید اعتباری برای شما فعال خواهد شد.</p>
                                  );
                                }
                                if (bnplMsg.includes('طرح اعتباری فعال')) {
                                  return (
                                    <p>شما در حال حاضر یک <strong>طرح اعتباری فعال</strong> دارید. 
                                    برای ثبت سفارش اعتباری جدید، ابتدا باید تمام اقساط طرح فعلی را تسویه کنید. 
                                    می‌توانید وضعیت اقساط خود را در <strong>صفحه حساب کاربری</strong> مشاهده کنید.</p>
                                  );
                                }
                                if (bnplMsg.includes('سفارش موفق دیگر نیاز دارید')) {
                                  return (
                                    <p>{bnplMsg} <br/>
                                    <small style={{color: '#666', fontSize: '12px'}}>
                                      سفارش‌های موفق شامل سفارش‌هایی هستند که کاملاً پرداخت شده یا تحویل داده شده‌اند.
                                    </small></p>
                                  );
                                }
                              return (
                                <p>تعداد سفارش‌های موفق شما هنوز به <strong>حداقل 2 سفارش</strong> نرسیده است. 
                                پس از تکمیل خریدهای بیشتر، امکان استفاده از خرید اعتباری برای شما فراهم خواهد شد.</p>
                              );
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {showBnplInstallmentExample && (
                        <div className="bnpl-example">
                          <h4>💰 محاسبه اقساط برای سفارش فعلی:</h4>
                          <p>برای سفارش {finalAmount.toLocaleString()} تومانی:</p>
                          <div className="installment-example">
                            {(() => {
                              const base = Math.floor(finalAmount / 4);
                              const remainder = finalAmount - base * 3;
                              return [
                                `قسط 1 (امروز): ${remainder.toLocaleString()} تومان`,
                                `قسط 2 (ماه آینده): ${base.toLocaleString()} تومان`,
                                `قسط 3 (2 ماه بعد): ${base.toLocaleString()} تومان`,
                                `قسط 4 (3 ماه بعد): ${base.toLocaleString()} تومان`
                              ].map((text, index) => (
                                <span key={index}>{text}</span>
                              ));
                            })()}
                          </div>
                          <p style={{fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: '0'}}>
                            * بدون سود اضافی | * قسط اول در هنگام ثبت سفارش کسر می‌شود
                          </p>
                        </div>
                        )}
                        {!showBnplInstallmentExample && payments.bnpl && (
                          <div className="hint-muted" style={{background:'#fffbe6', border:'1px solid #ffeaa7', borderRadius:8, padding:'10px 12px', marginTop:10}}>
                            برای مشاهده محاسبه اقساط، مبلغ سبد باید بین
                            {' '}
                            <b>{bnplLimits.min.toLocaleString()}</b>
                            {' '}
                            تا
                            {' '}
                            <b>{bnplLimits.max.toLocaleString()}</b>
                            {' '}
                            تومان باشد.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* انتخاب آدرس‌های ذخیره‌شده */}
            {addresses.length > 0 && (
              <div className="form-row">
                <label>انتخاب آدرس ذخیره‌شده:</label>
                <select value={selectedAddressId} onChange={(e)=>{
                  const id = e.target.value; setSelectedAddressId(id);
                  const def = addresses.find(a=>a._id===id);
                  if (def) setForm(prev=>({ ...prev, address: def.line||'', region: def.region||prev.region, plaque: def.plaque||'', unit: def.unit||'' }));
                }}>
                  {addresses.map(a=> <option key={a._id} value={a._id}>{a.line}{a.isDefault ? ' (پیش‌فرض)' : ''}</option>)}
                </select>
              </div>
            )}

            <div className="form-row">
              <label>آدرس کامل:</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="تهران، خیابان ..." required />
            </div>
            <div className="form-row-flex">
              <div>
                <label>پلاک:</label>
                <input name="plaque" value={form.plaque} onChange={handleChange} placeholder="مثلاً 12" required />
              </div>
              <div>
                <label>واحد:</label>
                <input name="unit" value={form.unit} onChange={handleChange} placeholder="مثلاً 3" required />
              </div>
            </div>
            <div className="form-row">
              <label>کد تخفیف:</label>
              <div style={{ display:'flex', gap: 8 }}>
                <input name="coupon" value={form.coupon} onChange={handleChange} placeholder="مثال: OFF30" />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading} style={{ background:'var(--brand-purple-1,#7156A5)', color:'#fff', border:'none', borderRadius:7, padding:'7px 12px', fontWeight:'bold', cursor:'pointer' }}>
                  {couponLoading ? 'در حال بررسی...' : 'اعمال'}
                </button>
              </div>
              {appliedCoupon && <div style={{ color:'var(--accent)', marginTop:6, fontSize:14 }}>اعمال شد: {appliedCoupon.code} - تخفیف: {discount.toLocaleString()} تومان</div>}
            </div>
            {error && <div className="checkout-error">{error}</div>}
            <button type="submit" className="checkout-submit-btn" disabled={submitting}>{submitting ? 'در حال ثبت...' : 'ثبت سفارش'}</button>
          </form>
            </div>
            <aside className="checkout-aside">
              <div className="checkout-summary">
                <div className="summary-title">خلاصه سفارش شما</div>
                <div className="summary-list">
                  {cart.map(item => (
                    <div key={item.id} className="summary-row"><span>{item.name} × {item.quantity}</span><span>{(item.price * item.quantity).toLocaleString()} تومان</span></div>
                  ))}
                  <div className="summary-row"><span>هزینه ارسال</span><span>{shippingFee.toLocaleString()} تومان{shippingFee===0? ' (ارسال رایگان)':''}</span></div>
                  <div className="summary-row summary-discount"><span>تخفیف</span><span>- {discount.toLocaleString()} تومان</span></div>
                  <div className="summary-row summary-final"><span>مبلغ قابل پرداخت</span><span>{finalAmount.toLocaleString()} تومان</span></div>
                  <div className="summary-row"><span>روش پرداخت</span><span>{form.payment==='online'?'آنلاین': form.payment==='cod'?'در محل':'اعتباری'}</span></div>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="checkout-success">
          <div className="success-title">✅ سفارش شما با موفقیت ثبت شد!</div>
          {orderId && <div>کد سفارش: <b>{orderId}</b></div>}
          <div>سفارش شما در تاریخ <b>{new Date(form.date).toLocaleDateString('fa-IR')}</b> و بازه <b>{form.time}</b> ارسال خواهد شد.</div>
          {form.payment==='online' && !paid && (
            <div style={{ marginTop: 16 }}>
              <button className="checkout-back-btn" onClick={async ()=>{
                try {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
                  if (!token) { alert('برای تایید پرداخت وارد شوید'); return; }
                  const res = await fetch(`${BASE_API}/api/orders/pay`, {
                    method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || 'خطا در پرداخت');
                  setPaid(true);
                } catch (e) { alert(e.message || 'خطای پرداخت'); }
              }}>ورود به درگاه (ماک) و تایید</button>
            </div>
          )}
          {form.payment!=='online' && (
            <div style={{ color:'#27ae60', marginTop:10 }}>روش پرداخت انتخاب‌شده: {form.payment==='cod'?'پرداخت در محل':'اعتباری (BNPL)'} — وضعیت سفارش: در انتظار پردازش</div>
          )}
          {paid && <div style={{ color:'#27ae60', marginTop:10, fontWeight:'bold' }}>پرداخت شد ✅</div>}
          <div style={{ marginTop: 22 }}><Link href="/"><button className="checkout-back-btn">بازگشت به فروشگاه</button></Link></div>
        </div>
      )}
      <style>{`
        .checkout-root { max-width: 1100px; margin: 44px auto; background: #f8fafc; border-radius: 22px; box-shadow: 0 8px 38px #e2e6ea; font-family: Vazirmatn,sans-serif; padding: 32px 17px; }
        .checkout-title { font-weight: bold; font-size: 2rem; color: var(--accent); margin-bottom: 28px; text-align: center; }
        .checkout-icon { font-size: 2.2rem; margin-left: 7px; }
        .checkout-grid { display:grid; grid-template-columns: 1.6fr .9fr; gap: 24px; align-items:start; }
        .selection-badges { display:flex; gap: 10px; flex-wrap: wrap; margin: 6px 0 12px; grid-column: 1 / -1; justify-content: center; }
        .badge { background:#fff; border:1px solid #eee; border-radius: 999px; padding: 6px 10px; font-size: 13px; box-shadow: 0 1px 6px #f1f1f1; cursor: pointer; }
        .badge-muted { background:#f6f7f9; cursor: default; }
        .checkout-main { min-width: 0; }
        .checkout-aside { position: sticky; top: 84px; height: fit-content; align-self: start; }
        .checkout-form { margin-bottom: 32px; background: #fff; border-radius: 13px; box-shadow: 0 2px 14px #eee; padding: 24px 16px 16px 16px; display: flex; flex-direction: column; gap: 12px; }
        .form-row { margin-bottom: 14px; display: flex; flex-direction: column; }
        .form-row label { font-weight: bold; color: var(--accent); margin-bottom: 6px; }
        .form-row input, .form-row select { width: 100%; padding: 9px 13px; border-radius: 7px; border: 1px solid #ddd; font-size: 16px; background: #f7f7f7; transition: border-color .2s; }
        .form-row input:focus, .form-row select:focus { border-color: var(--accent); background: #fff4e6; }
        .section-title { margin: 6px 0 4px; font-size: 1.05rem; color:#334155; font-weight:900; display:flex; align-items:center; gap:6px; }
        .form-row-flex { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .form-row-flex input { width: 100%; padding: 9px 13px; border-radius: 7px; border: 1px solid #ddd; font-size: 16px; background: #f7f7f7; transition: border-color .2s; }
        .form-row-flex input:focus { border-color: var(--accent); background: #fff4e6; }
        .triple-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
        .triple-card { background:#fff; border:1px solid #eee; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px #f2f2f2; display:flex; flex-direction:column; }
        .auto-adjust-msg { background:#fff8e1; color:#8a6d3b; border:1px solid #ffe0a3; border-radius:8px; padding:6px 10px; font-size:13px; margin-bottom:6px; }
        .confirm-row { display:flex; align-items:center; gap:10px; margin: 6px 0 10px; }
        .confirm-delivery-btn { background: var(--accent); color:#fff; border:none; border-radius:10px; padding:10px 14px; font-weight:800; cursor:pointer; box-shadow:0 2px 10px #eee; }
        .confirm-delivery-btn[disabled], .confirm-delivery-btn[aria-disabled="true"] { opacity:.5; cursor:not-allowed; }
        .ok-msg { color:#16a34a; font-weight:800; }
        .triple-card select { background:#fff; }
        /* revert chip styles */
        .triple-card.pulse { animation: pulseShadow .6s ease-out; }
        @keyframes pulseShadow {
          0% { box-shadow: 0 0 0 rgba(255,140,26,0); }
          50% { box-shadow: 0 0 0 4px rgba(255,140,26,.25); }
          100% { box-shadow: 0 0 0 rgba(255,140,26,0); }
        }
        .triple-card label { font-weight: 800; color: var(--accent); margin-bottom: 6px; }
        .triple-card select { padding: 8px 10px; border-radius: 8px; border:1px solid #e5e7eb; background:#f9fafb; font-size: 15px; }
        @media (max-width: 1024px) { .triple-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .triple-row { grid-template-columns: 1fr; } }
        .pay-methods { display:flex; gap:10px; flex-wrap:wrap }
        .pm { display:flex; align-items:center; gap:6px; background:#fff; border:1px solid #eee; border-radius:8px; padding:8px 10px; cursor:pointer }
        .pm.active { border-color: var(--accent); box-shadow: 0 1px 6px #eee }
        .date-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px; }
        .date-tile { background:#fff; border:2px solid var(--accent); color:var(--accent); border-radius:10px; padding:10px; cursor:pointer; font-weight:bold; box-shadow:0 1px 6px #eee; }
        .date-tile.active { background:var(--accent); color:#fff; }
        .checkout-error { color: #c0392b; background: #fdecea; border: 1px solid #f5c6cb; padding: 8px 10px; border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
        .chips-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .chip { background:#fff; border:1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; cursor:pointer; font-weight:800; color:#374151; box-shadow:0 1px 6px #f3f4f6; transition: all .2s; text-align:center; }
        .chip:hover { border-color: var(--accent); box-shadow: 0 2px 10px #eee }
        .chip.active { background: var(--accent); color:#fff; border-color: var(--accent); box-shadow: 0 2px 10px rgba(255,140,26,.3) }
        .chip:disabled { opacity:.45; cursor:not-allowed; text-decoration: line-through; }
        .chip-sub { display:block; font-size: 12px; color: #6b7280; font-weight:700; margin-top: 4px; }
        .hint-muted { color:#6b7280; font-size:12px; margin-top:6px; }
        
        /* BNPL Toggle Styles */
        .bnpl-toggle-section { 
          margin: 16px 0; 
          font-size: 14px; 
          line-height: 1.6; 
        }
        
        .bnpl-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid var(--brand-purple-2, #663191);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: var(--brand-purple-2, #663191);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        
        .bnpl-toggle-btn:hover {
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 49, 145, 0.15);
        }
        
        .bnpl-toggle-icon {
          font-size: 16px;
          margin-left: 8px;
        }
        
        .bnpl-arrow {
          font-size: 12px;
          transition: transform 0.3s ease;
          margin-right: 4px;
        }
        
        .bnpl-arrow.open {
          transform: rotate(180deg);
        }
        
        .bnpl-toggle-btn.open {
          border-radius: 12px 12px 0 0;
        }
        
        .bnpl-info-content {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid var(--brand-purple-2, #663191);
          border-top: none;
          border-radius: 0 0 12px 12px;
          padding: 20px;
          margin-top: -2px;
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .bnpl-info-content h4 { 
          color: var(--brand-purple-2, #663191); 
          margin: 16px 0 8px 0; 
          font-size: 15px; 
          font-weight: bold; 
        }
        
        .bnpl-info-content ul { 
          margin: 8px 0 16px 20px; 
          padding: 0; 
        }
        
        .bnpl-info-content li { 
          margin-bottom: 6px; 
          color: #495057; 
        }
        
        .bnpl-blocked-reason { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          border-radius: 10px; 
          padding: 16px; 
          margin: 16px 0; 
        }
        
        .bnpl-blocked-reason h4 { 
          color: #856404; 
          margin-top: 0; 
        }
        
        .blocked-reason-content p { 
          color: #6c5b00; 
          margin: 0; 
          line-height: 1.5; 
        }
        
        .bnpl-example { 
          background: #e3f2fd; 
          border-radius: 10px; 
          padding: 16px; 
          margin: 16px 0 0 0; 
        }
        
        .bnpl-example h4 { 
          color: #1565c0; 
          margin-top: 0; 
        }
        
        .bnpl-example p { 
          color: #1565c0; 
          margin: 8px 0; 
          font-weight: 500; 
        }
        
        .installment-example { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 8px; 
          margin-top: 12px; 
        }
        
        .installment-example span { 
          background: white; 
          padding: 8px 12px; 
          border-radius: 8px; 
          border: 1px solid #bbdefb; 
          font-size: 13px; 
          font-weight: 500; 
          color: #1565c0; 
          text-align: center; 
        }
        
        @media (max-width: 600px) {
          .installment-example { grid-template-columns: 1fr; }
          .bnpl-info-section { padding: 16px; margin: 12px 0; }
          .bnpl-info-content h4 { font-size: 14px; }
        }
        .checkout-submit-btn { width: 100%; background: linear-gradient(90deg,var(--accent) 60%,#ffab4d 100%); color: #fff; border: none; border-radius: 12px; padding: 15px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 14px; box-shadow: 0 2px 12px #e2e2e2; transition: background .2s; }
        .checkout-submit-btn:hover { background: linear-gradient(90deg,#ff8c1a 60%,#ffb366 100%); }
        .checkout-summary { background: #fff; border: 1px solid #eee; border-radius: 14px; padding: 18px; box-shadow: 0 6px 24px rgba(0,0,0,.04); margin-bottom: 0; min-width: 280px; }
        .summary-title { font-weight: 900; font-size: 1.05rem; color: var(--accent); margin-bottom: 12px; text-align: center; }
        .summary-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 0; }
        .summary-row { display: flex; justify-content: space-between; font-size: 15px; }
        .summary-row + .summary-row { border-top: 1px dashed #f1f1f1; padding-top: 8px; }
        .summary-discount { color: #e67e22; }
        .summary-final { font-weight: 900; font-size: 18px; color: var(--accent); margin-top: 8px; }
        .checkout-success { text-align: center; color: var(--accent); font-size: 22px; padding: 70px 0; font-family: Vazirmatn,sans-serif; }
        .success-title { font-weight: bold; font-size: 26px; margin-bottom: 16px; }
        .checkout-back-btn { background: var(--accent); color: #fff; border: none; border-radius: 9px; padding: 12px 38px; font-size: 17px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 12px #eee; transition: background .2s; }
        .checkout-back-btn:hover { background: #ff8c1a; }
        @media (max-width: 980px) { .checkout-grid { grid-template-columns: 1fr; } .checkout-aside { position: static; margin-top: 10px; } }
        @media (max-width: 640px) { .date-tiles { grid-template-columns: repeat(2, 1fr); } .chips-grid { grid-template-columns: repeat(2, 1fr); } .form-row-flex { grid-template-columns: 1fr; } .time-chips { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        /* Bottom sheet */
        /* سبک‌های شییت حذف شد */
        .sheet-header { display:flex; align-items:center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eee; }
        .sheet-title { font-weight: 900; color: var(--accent); display:flex; align-items:center; gap:8px }
        .sheet-body { padding: 12px 16px 18px; overflow:auto; }
        .sheet-close { background: transparent; border:none; font-size: 20px; cursor:pointer; color:#555 }
        .sheet-actions { display:flex; gap:10px; justify-content: flex-end; padding: 8px 16px 16px; }
        .sheet-btn { border:none; border-radius: 10px; padding: 10px 16px; font-weight: 800; cursor: pointer; }
        .sheet-btn.cancel { background:#f0f0f0; color:#444 }
        .sheet-btn.confirm { background: var(--accent); color:#fff }
        
      `}</style>
      {/* modal sheet حذف شد؛ انتخاب‌ها فقط از کارت‌های میانی انجام می‌شوند */}
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrdersAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status:'', payment:'' });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [couriers, setCouriers] = useState([]);
  const [pickerFor, setPickerFor] = useState(null);
  const statusFa = { pending: 'در انتظار پرداخت', paid: 'پرداخت شده', shipped: 'ارسال شده', delivered: 'تکمیل شده', cancelled: 'لغو شده' };
  const paymentFa = { online: 'الکترونیکی', cod: 'در محل', bnpl: 'اعتباری' };

  // admin gate
  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  // Jalali helpers (same as dashboard)
  function div(a,b){ return ~~(a/b); }
  function mod(a,b){ return a-~~(a/b)*b; }
  function jalaliToGregorian(jy, jm, jd){ jy=+jy; jm=+jm; jd=+jd; var gy; if (jy>979){ gy=1600; jy-=979; } else { gy=621; } var days = 365*jy + div(jy,33)*8 + div(mod(jy,33)+3,4); for (var i=0;i<jm-1;++i){ days += (i<6?31:30); } days += jd-1; gy += 400*div(days,146097); days = mod(days,146097); if (days>36524){ gy += 100*((--days/36524)|0); days = mod(days,36524); if (days>=365) days++; } gy += 4*div(days,1461); days = mod(days,1461); if (days>365){ gy += ((days-1)/365)|0; days = (days-1)%365; } var gd = days+1; var sal_a=[0,31,(gy%4===0&&gy%100!==0)||gy%400===0?29:28,31,30,31,30,31,31,30,31,30,31]; var gm; for(gm=0;gm<13&&gd>sal_a[gm];gm++){ gd-=sal_a[gm]; } return [gy,gm,gd]; }
  function gregorianToJalali(gy,gm,gd){ gy=+gy; gm=+gm; gd=+gd; var g_d_m=[0,31,59,90,120,151,181,212,243,273,304,334]; var jy=(gy<=1600)?0:979; gy -= (gy<=1600)?621:1600; var gy2 = gm>2?gy+1:gy; var days = 365*gy + div(gy2,4) - div(gy2,100) + div(gy2,400) - 80 + gd + g_d_m[gm-1]; jy += 33*div(days,12053); days = mod(days,12053); jy += 4*div(days,1461); days = mod(days,1461); if (days>365){ jy += div(days-1,365); days = mod(days-1,365); } var jm = (days<186)?1+div(days,31):7+div(days-186,30); var jd = 1 + mod(days,(days<186?31:30)); return [jy+1,jm,jd]; }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function jToIso({y,m,d}){ const [gy,gm,gd] = jalaliToGregorian(y,m,d); return `${gy}-${pad2(gm)}-${pad2(gd)}`; }
  function todayJalali(){ const t=new Date(); const [jy,jm,jd] = gregorianToJalali(t.getFullYear(), t.getMonth()+1, t.getDate()); return { y:jy, m:jm, d:jd }; }
  function jDaysInMonth(y,m){ return m<=6?31:(m<=11?30:30); }
  const monthNamesFa=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const [jFilter, setJFilter] = useState(()=>{ const t=todayJalali(); return { from:t, to:t }; });
  const [useDateFilter, setUseDateFilter] = useState(true);

  async function loadOrders() {
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const qs = new URLSearchParams();
      if (useDateFilter) {
        const fromG = jFilter?.from ? jToIso(jFilter.from) : '';
        const toG = jFilter?.to ? jToIso(jFilter.to) : '';
        if (fromG) qs.set('from', fromG);
        if (toG) qs.set('to', toG);
      }
      if (filters.status) qs.set('status', filters.status);
      if (filters.payment) qs.set('payment', filters.payment);
      if (q && q.trim()) qs.set('q', q.trim());
      qs.set('page', String(page));
      qs.set('pageSize', String(pageSize));
      const res = await fetch(`${BASE_API}/api/orders/all?`+qs.toString(), { headers:{ Authorization:`Bearer ${token}` } });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'خطا در دریافت سفارش‌ها');
      const list = d.orders||[];
      setOrders(list);
      setTotal(Number(d.total||list.length||0));
    } catch(e){ setError(e.message||'خطا'); }
  }

  useEffect(()=>{ if (gateOk) loadOrders(); },[gateOk]);
  useEffect(()=>{ if (gateOk) loadOrders(); },[page, pageSize]);

  async function loadCouriers(){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/couriers?active=true`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'خطا در دریافت پیک‌ها');
      setCouriers(d.couriers||[]);
    }catch(e){ alert(e.message||'خطا'); }
  }

  async function exportCsv(){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const qs = new URLSearchParams();
      if (useDateFilter) {
        const fromG = jFilter?.from ? jToIso(jFilter.from) : '';
        const toG = jFilter?.to ? jToIso(jFilter.to) : '';
        if (fromG) qs.set('from', fromG);
        if (toG) qs.set('to', toG);
      }
      if (filters.status) qs.set('status', filters.status);
      if (filters.payment) qs.set('payment', filters.payment);
      qs.set('format','csv');
      const res = await fetch(`${BASE_API}/api/orders/all?`+qs.toString(), { headers:{ Authorization:`Bearer ${token}` } });
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
    }catch(e){ alert('دانلود CSV ناموفق بود'); }
  }

  const [cancelForm, setCancelForm] = useState({});
  async function sendToCourier(orderId, courierId){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/orders/${orderId}/send-to-courier`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ courierId }) });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'ارسال ناموفق بود');
      setPickerFor(null);
      if (d.waLink) {
        const go = confirm('ارسال از طریق لینک واتساپ انجام می‌شود. باز شود؟');
        if (go && typeof window!=='undefined') window.open(d.waLink, '_blank');
      } else {
        alert('پیام برای پیک ارسال شد');
      }
    }catch(e){ alert(e.message||'خطا'); }
  }
  async function handleCancel(order){
    try{
      const id = order._id || order.id;
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const payload = cancelForm[id] || {};
      const reason = payload.reason === 'سایر' ? (payload.other || '') : (payload.reason || '');
      const res = await fetch(`${BASE_API}/api/orders/${id}/cancel`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ reason, refund: Number(payload.refund)||0 }) });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'لغو ناموفق بود');
      setOrders(prev=>prev.map(o=> ( (o._id||o.id)===id ? d.order : o)));
      alert('سفارش لغو شد');
    }catch(e){ alert(e.message||'خطا'); }
  }

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title">
          <span className="admin-icon">📦</span> 
          مدیریت سفارش‌ها
        </h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{total}</span>
            <span className="stat-label">کل سفارش‌ها</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orders.filter(o => o.status === 'pending').length}</span>
            <span className="stat-label">در انتظار</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orders.filter(o => o.status === 'paid').length}</span>
            <span className="stat-label">پرداخت شده</span>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link active">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </nav>

      {/* فیلترها و جست‌وجو */}
      <div className="filters-section">
        <div className="search-row">
          <div className="search-group">
            <label>🔍</label>
            <input 
              className="search-input"
              placeholder="جست‌وجو در نام، تلفن یا کد سفارش..." 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(1); loadOrders(); } }} 
            />
          </div>
          <button className="btn primary" onClick={()=>{ setPage(1); loadOrders(); }}>
            جست‌وجو
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>وضعیت:</label>
            <select className="filter-select" value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>
              <option value="">همه</option>
              <option value="pending">در انتظار</option>
              <option value="paid">پرداخت شده</option>
              <option value="shipped">ارسال شده</option>
              <option value="delivered">تکمیل شده</option>
              <option value="cancelled">لغو شده</option>
            </select>
          </div>

          <div className="filter-group">
            <label>نوع پرداخت:</label>
            <select className="filter-select" value={filters.payment} onChange={e=>setFilters({...filters, payment:e.target.value})}>
              <option value="">همه</option>
              <option value="online">آنلاین</option>
              <option value="cod">در محل</option>
              <option value="bnpl">اعتباری</option>
            </select>
          </div>

          <div className="filter-group">
            <label>نمایش:</label>
            <select className="filter-select" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="date-filter-row">
          <label className="date-filter-toggle">
            <input 
              type="checkbox" 
              checked={useDateFilter} 
              onChange={e=>setUseDateFilter(e.target.checked)} 
            />
            فیلتر بر اساس تاریخ تحویل
            {useDateFilter && (
              <span className="default-filter-note">
                (پیش‌فرض: تحویل امروز)
              </span>
            )}
          </label>
          
          {useDateFilter && (
            <div className="date-inputs">
              <div className="date-group">
                <span>از:</span>
                <select disabled={!useDateFilter} value={jFilter.from.y} onChange={e=>setJFilter(prev=>({ ...prev, from: { ...prev.from, y:Number(e.target.value) } }))}>
                  {Array.from({length:6},(_,i)=> todayJalali().y - 5 + i).map(y=> <option key={'fy'+y} value={y}>{y}</option>)}
                </select>
                <select disabled={!useDateFilter} value={jFilter.from.m} onChange={e=>{ const m=Number(e.target.value); setJFilter(prev=>{ const dmax=jDaysInMonth(prev.from.y,m); const d=Math.min(prev.from.d,dmax); return ({ ...prev, from:{ ...prev.from, m, d } }); }); }}>
                  {monthNamesFa.map((n,idx)=> <option key={'fm'+idx} value={idx+1}>{n}</option>)}
                </select>
                <select disabled={!useDateFilter} value={jFilter.from.d} onChange={e=>setJFilter(prev=>({ ...prev, from:{ ...prev.from, d:Number(e.target.value) } }))}>
                  {Array.from({length:jDaysInMonth(jFilter.from.y, jFilter.from.m)},(_,i)=>i+1).map(d=> <option key={'fd'+d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="date-group">
                <span>تا:</span>
                <select disabled={!useDateFilter} value={jFilter.to.y} onChange={e=>setJFilter(prev=>({ ...prev, to: { ...prev.to, y:Number(e.target.value) } }))}>
                  {Array.from({length:6},(_,i)=> todayJalali().y - 5 + i).map(y=> <option key={'ty'+y} value={y}>{y}</option>)}
                </select>
                <select disabled={!useDateFilter} value={jFilter.to.m} onChange={e=>{ const m=Number(e.target.value); setJFilter(prev=>{ const dmax=jDaysInMonth(prev.to.y,m); const d=Math.min(prev.to.d,dmax); return ({ ...prev, to:{ ...prev.to, m, d } }); }); }}>
                  {monthNamesFa.map((n,idx)=> <option key={'tm'+idx} value={idx+1}>{n}</option>)}
                </select>
                <select disabled={!useDateFilter} value={jFilter.to.d} onChange={e=>setJFilter(prev=>({ ...prev, to:{ ...prev.to, d:Number(e.target.value) } }))}>
                  {Array.from({length:jDaysInMonth(jFilter.to.y, jFilter.to.m)},(_,i)=>i+1).map(d=> <option key={'td'+d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="action-row">
          <button className="btn primary" onClick={()=>{ setPage(1); loadOrders(); }}>
            اعمال فیلترها
          </button>
          <button className="btn secondary" onClick={loadOrders}>
            🔄 بروزرسانی
          </button>
          <button 
            className="btn show-all" 
            onClick={()=>{ 
              setUseDateFilter(false); 
              setPage(1); 
              loadOrders(); 
            }}
          >
            📋 نمایش همه سفارشات
          </button>
          <button 
            className="btn today-filter" 
            onClick={()=>{ 
              const today = todayJalali();
              setJFilter({ from: today, to: today });
              setUseDateFilter(true); 
              setPage(1); 
              loadOrders(); 
            }}
          >
            📅 تحویل امروز
          </button>
          <button className="btn export" onClick={exportCsv}>
            📊 خروجی CSV
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {/* جدول سفارش‌ها */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="orders-table">
            <thead>
              <tr>
                <th>مشتری</th>
                <th>تلفن</th>
                <th>آدرس</th>
                <th>محصولات</th>
                <th>تاریخ تحویل</th>
                <th>زمان ثبت سفارش</th>
                <th>کد سفارش</th>
                <th>وضعیت</th>
                <th>پرداخت</th>
                <th>مبلغ</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-row">
                    <div className="empty-content">
                      <span className="empty-icon">📦</span>
                      <span>سفارشی یافت نشد</span>
                    </div>
                  </td>
                </tr>
              ) : (()=>{
                const start = (page-1)*pageSize;
                const slice = orders.slice(start, start+pageSize);
                return slice.map(o=>{
                  const rawName = (String(o.contactName||'').trim()) || (String(o.user?.name||'').trim());
                  const productsTxt = (o.products||[]).map(p=> (p.name||p.product?.name||'محصول') + (p.qty?` ×${p.qty}`:(p.quantity?` ×${p.quantity}`:''))).join(', ');
                  const createdAtFull = o.createdAt ? new Date(o.createdAt).toLocaleString('fa-IR', {
                    year: 'numeric',
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : '-';
                  const time = o.deliverySlot ? `${new Date(o.deliveryDate||Date.now()).toLocaleDateString('fa-IR')} - ${o.deliverySlot}` : (o.receiveTime || '-');
                  const oid = o._id || o.id;
                  
                  return (
                    <tr key={oid} className="order-row">
                      <td className="customer-name priority-cell">{rawName||'-'}</td>
                      <td className="phone priority-cell">{o.contactPhone || o.phone || '-'}</td>
                      <td className="address priority-cell">
                        <div className="address-content">
                          <span className="region">{o.region}</span>
                          <span className="full-address">{o.address || '-'}</span>
                        </div>
                      </td>
                      <td className="products priority-cell">
                        <div className="products-content" title={productsTxt}>
                          {productsTxt || '-'}
                        </div>
                      </td>
                      <td className="delivery-time priority-cell">{time}</td>
                      <td className="created-at priority-cell">
                        <div className="datetime-content">
                          <span className="datetime-full">{createdAtFull}</span>
                        </div>
                      </td>
                      <td className="order-code">
                        <span className="code-badge">#{o.orderNumber || oid.slice(-8)}</span>
                      </td>
                      <td className="status">
                        <span className={`status-badge status-${o.status}`}>
                          {statusFa[o.status] || o.status}
                        </span>
                      </td>
                      <td className="payment">
                        <span className={`payment-badge payment-${o.paymentMethod}`}>
                          {paymentFa[o.paymentMethod] || o.paymentMethod}
                        </span>
                      </td>
                      <td className="price">
                        <span className="price-amount">{Number(o.totalPrice||0).toLocaleString()}</span>
                        <span className="currency">تومان</span>
                      </td>
                      <td className="actions">
                        {o.status !== 'cancelled' ? (
                          <div className="action-controls">
                            <select 
                              className="reason-select"
                              value={(cancelForm[oid]?.reason)||''} 
                              onChange={e=>setCancelForm(prev=>({ ...prev, [oid]: { ...(prev[oid]||{}), reason: e.target.value }}))}
                            >
                              <option value="">دلیل لغو</option>
                              <option value="عدم موجودی محصول مورد نظر کاربر">عدم موجودی</option>
                              <option value="مغایرت آدرس و منطقه انتخاب‌شده مشتری برای ارسال">مغایرت آدرس</option>
                              <option value="ثبت آدرس نامعتبر و نامفهوم">آدرس نامعتبر</option>
                              <option value="سایر">سایر</option>
                            </select>
                            
                            {(cancelForm[oid]?.reason === 'سایر') && (
                              <input 
                                className="other-input"
                                placeholder="توضیح..." 
                                value={(cancelForm[oid]?.other)||''} 
                                onChange={e=>setCancelForm(prev=>({ ...prev, [oid]: { ...(prev[oid]||{}), other: e.target.value }}))} 
                              />
                            )}
                            
                            <input 
                              className="refund-input"
                              placeholder="مبلغ بازگشت" 
                              type="number" 
                              value={(cancelForm[oid]?.refund)||''} 
                              onChange={e=>setCancelForm(prev=>({ ...prev, [oid]: { ...(prev[oid]||{}), refund: e.target.value }}))} 
                            />
                            
                            <button className="btn cancel-btn" onClick={()=>handleCancel(o)}>
                              لغو
                            </button>
                            <button className="btn" onClick={()=>{ setPickerFor(oid); loadCouriers(); }}>
                              ارسال آدرس به پیک
                            </button>
                          </div>
                        ) : (
                          <span className="cancelled-text">لغو شده</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">
            نمایش {total? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize, total)} از {total} سفارش
          </div>
          <div className="pagination-controls">
            <button 
              className="btn pagination-btn" 
              onClick={()=>setPage(p=>Math.max(1,p-1))} 
              disabled={page===1}
            >
              قبلی
            </button>
            <span className="page-number">صفحه {page}</span>
            <button 
              className="btn pagination-btn" 
              onClick={()=>setPage(p=> (p*pageSize<total? p+1 : p))} 
              disabled={page*pageSize>=total}
            >
              بعدی
            </button>
          </div>
        </div>
      </div>

      {pickerFor && (
        <div className="modal-backdrop" onClick={()=>setPickerFor(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>انتخاب پیک</h3>
            <div className="couriers-list">
              {couriers.length===0 ? (
                <div>پیک فعالی وجود ندارد. ابتدا از بخش پیک‌ها اضافه کنید.</div>
              ) : couriers.map(c=> (
                <button key={c._id} className="courier-item" onClick={()=> sendToCourier(pickerFor, c._id)}>
                  <span>{c.name}</span>
                  <span className="phone">{c.phone}</span>
                </button>
              ))}
            </div>
            <button className="btn" onClick={()=>setPickerFor(null)}>بستن</button>
          </div>
        </div>
      )}

      <style>{`
        /* Layout اصلی */
        .admin-root {
          max-width: 1400px;
          margin: 20px auto;
          background: #f8fafc;
          border-radius: 16px;
          font-family: Vazirmatn, sans-serif;
          padding: 24px;
          min-height: 100vh;
        }

        /* Header */
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .admin-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-icon {
          font-size: 2rem;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          text-align: center;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          min-width: 80px;
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.9;
        }

        /* Navigation */
        .admin-nav {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 4px;
          margin-bottom: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .nav-link {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 10px 16px;
          color: #495057;
          white-space: nowrap;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .nav-link.active {
          background: linear-gradient(135deg, #ff7f23, #ff6b35);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(255, 127, 35, 0.3);
        }

        /* Filters Section */
        .filters-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .search-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .search-group {
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 8px 12px;
          flex: 1;
          max-width: 400px;
        }

        .search-group label {
          margin-left: 8px;
          font-size: 1.2rem;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
          padding: 4px 8px;
          font-size: 14px;
        }

        .filter-row {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 600;
          color: #495057;
          white-space: nowrap;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          min-width: 120px;
        }

        .date-filter-row {
          margin-bottom: 16px;
        }

        .date-filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 12px;
        }

        .default-filter-note {
          font-size: 12px;
          color: #6c757d;
          font-weight: 400;
          margin-right: 8px;
        }

        .date-inputs {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .date-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-group span {
          font-weight: 600;
          color: #495057;
        }

        .date-group select {
          padding: 6px 10px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background: white;
          font-size: 13px;
        }

        .action-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Buttons */
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn.primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        .btn.secondary {
          background: linear-gradient(135deg, #95a5a6, #7f8c8d);
          color: white;
        }

        .btn.export {
          background: linear-gradient(135deg, #27ae60, #229954);
          color: white;
        }

        .btn.show-all {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
        }

        .btn.today-filter {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
        }

        .btn.cancel-btn {
          background: #dc3545;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        .btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .pagination-btn {
          background: #6c757d;
          color: white;
        }

        /* Error Message */
        .error-message {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          color: #e53e3e;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        /* Table Container */
        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          padding: 20px;
          overflow: hidden;
        }

        .table-scroll {
          overflow-x: auto;
          margin: -20px;
          padding: 20px;
        }

        /* Orders Table */
        .orders-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 1000px;
        }

        .orders-table th {
          background: #f8f9fa;
          color: #495057;
          font-weight: 600;
          padding: 8px 6px;
          text-align: center;
          border-bottom: 1px solid #dee2e6;
          position: sticky;
          top: 0;
          z-index: 10;
          font-size: 11px;
        }

        /* Priority Headers */
        .orders-table th:nth-child(1),
        .orders-table th:nth-child(2),
        .orders-table th:nth-child(3),
        .orders-table th:nth-child(4),
        .orders-table th:nth-child(5),
        .orders-table th:nth-child(6) {
          background: #e3f2fd;
          color: #1976d2;
          font-weight: 700;
        }

        .orders-table td {
          padding: 6px 4px;
          border-bottom: 1px solid #f1f3f4;
          vertical-align: middle;
          text-align: center;
          font-size: 11px;
        }

        .order-row {
          transition: all 0.2s ease;
        }

        .order-row:hover {
          background-color: #f1f3f4;
        }

        /* Priority Cells */
        .priority-cell {
          background: #f8fbff;
          font-weight: 600;
        }

        /* Table Cells */
        .customer-name {
          min-width: 110px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 13px;
        }

        .phone {
          min-width: 100px;
          direction: ltr;
          font-size: 12px;
        }

        .products {
          min-width: 180px;
          max-width: 220px;
        }

        .products-content {
          font-size: 12px;
          color: #495057;
          line-height: 1.3;
          text-align: right;
        }

        .delivery-time {
          min-width: 120px;
          font-size: 12px;
          color: #6c757d;
        }

        .created-at {
          min-width: 140px;
        }

        .datetime-content {
          font-size: 11px;
          color: #6c757d;
          direction: ltr;
        }

        .order-code {
          min-width: 90px;
        }

        .code-badge {
          background: #6c757d;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .address {
          min-width: 160px;
          max-width: 200px;
        }

        .address-content {
          font-size: 12px;
          line-height: 1.3;
        }

        .region {
          background: #e3f2fd;
          color: #1976d2;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 2px;
          display: inline-block;
        }

        .full-address {
          font-size: 11px;
          color: #6c757d;
          text-align: right;
        }

        .status {
          min-width: 100px;
        }

        .status-badge, .payment-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }

        /* Status Colors */
        .status-pending { background: #fff3cd; color: #856404; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-shipped { background: #cce7ff; color: #004085; }
        .status-delivered { background: #d1ecf1; color: #0c5460; }
        .status-cancelled { background: #f8d7da; color: #721c24; }

        /* Payment Colors */
        .payment-online { background: #e2f3ff; color: #0056b3; }
        .payment-cod { background: #fff2cc; color: #664d03; }
        .payment-bnpl { background: #e8f5e8; color: #2e7d32; }

        .payment {
          min-width: 80px;
        }

        .price {
          min-width: 120px;
        }

        .price-amount {
          font-weight: 700;
          color: #27ae60;
          font-size: 14px;
          display: block;
        }

        .currency {
          font-size: 11px;
          color: #6c757d;
        }

        .actions {
          min-width: 200px;
        }

        .action-controls {
          display: flex;
          gap: 3px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .reason-select {
          padding: 2px 4px;
          border: 1px solid #dee2e6;
          border-radius: 3px;
          background: white;
          font-size: 10px;
          min-width: 80px;
        }

        .other-input, .refund-input {
          padding: 2px 4px;
          border: 1px solid #dee2e6;
          border-radius: 3px;
          font-size: 10px;
        }

        .other-input {
          width: 60px;
        }

        .refund-input {
          width: 50px;
        }

        .cancelled-text {
          color: #6c757d;
          font-style: italic;
          font-size: 12px;
        }

        /* Empty State */
        .empty-row {
          height: 200px;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 3rem;
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .pagination-info {
          color: #6c757d;
          font-size: 14px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-number {
          font-weight: 600;
          color: #495057;
          padding: 0 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-root { 
            margin: 10px; 
            padding: 16px; 
          }
          
          .admin-header { 
            flex-direction: column; 
            gap: 16px; 
            text-align: center; 
          }
          
          .header-stats { 
            flex-wrap: wrap; 
            justify-content: center; 
          }
          
          .order-body { 
            grid-template-columns: 1fr; 
          }
          
          .cancel-controls { 
            flex-direction: column; 
            align-items: stretch; 
          }
          
          .pagination { 
            flex-direction: column; 
            gap: 12px; 
          }
        }
      `}</style>
    </div>
  );
}



'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BnplAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gateOk, setGateOk] = useState(false);
  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [overdueRows, setOverdueRows] = useState([]);
  const [showOverdue, setShowOverdue] = useState(false);
  async function load(){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) return;
      const params = new URLSearchParams();
      if (q) params.set('q', q.trim());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`${BASE_API}/api/bnpl/all?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await res.json();
      if (res.ok && d?.plans){
        const now = new Date();
        const mapped = d.plans.map(p=>{
          const unpaidInstallments = (p.installments||[]).filter(i=>i.status!=='paid');
          const nextUnpaid = unpaidInstallments[0];
          const hasOverdue = unpaidInstallments.some(i => new Date(i.dueDate) < now);
          const overdueCount = unpaidInstallments.filter(i => new Date(i.dueDate) < now).length;
          
          return {
            customer: p.user?.name||'کاربر', 
            order: String(p.order?._id||''),
            orderNumber: p.order?.orderNumber || '',
            phone: p.order?.contactPhone || '',
            paid: (p.installments||[]).filter(i=>i.status==='paid').length,
            total: (p.installments||[]).length,
            nextDue: nextUnpaid?.dueDate || '-',
            remaining: Math.max(0, Number(p.totalAmount||0) - (p.installments||[]).filter(i=>i.status==='paid').reduce((a,i)=>a+Number(i.amount||0),0)),
            hasOverdue: hasOverdue,
            overdueCount: overdueCount,
            status: p.status
          };
        });
        setRows(mapped);
        setTotal(Number(d.total||mapped.length));
        
        // فیلتر کردن موارد سررسیده
        const overdue = mapped.filter(r => r.hasOverdue && r.status === 'active');
        setOverdueRows(overdue);
      }
      // load settings for BNPL caps
      try {
        const sres = await fetch(`${BASE_API}/api/admin/settings`, { headers:{ Authorization:`Bearer ${token}` } });
        const sd = await sres.json();
        if (sres.ok && sd?.settings) {
          setSettings(sd.settings);
        }
      } catch(_) {}
    }catch(_){ }
  }
  useEffect(()=>{ if (gateOk) load(); },[gateOk]);
  useEffect(()=>{ if (gateOk) { setPage(1); } },[q, pageSize]);
  useEffect(()=>{ if (gateOk) load(); },[page, pageSize, q]);

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <h2 className="admin-title"><span className="admin-icon">💳</span> مدیریت BNPL</h2>
      <div className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link active">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </div>
      {/* آمار سریع */}
      <div className="admin-box" style={{marginBottom: 20}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16}}>
          <div className="stat-card">
            <div className="stat-number">{rows.length}</div>
            <div className="stat-label">کل طرح‌ها</div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-number">{overdueRows.length}</div>
            <div className="stat-label">اقساط سررسیده</div>
          </div>
          <button 
            className={`toggle-btn ${showOverdue ? 'active' : ''}`}
            onClick={() => setShowOverdue(!showOverdue)}
          >
            {showOverdue ? '📋 نمایش همه' : '🔴 نمایش سررسیده‌ها'}
          </button>
        </div>
      </div>

      {/* تنظیمات BNPL */}
      <div className="admin-box" style={{marginBottom:20}}>
        <h3 className="section-title">تنظیمات BNPL</h3>
        {settings ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
            <label style={{display:'flex',flexDirection:'column',gap:6}}>
              <span>حداقل مبلغ سبد (تومان)</span>
              <input type="number" value={settings.bnpl?.minCartTotal||700000} onChange={e=> setSettings(s=> ({...s, bnpl:{...(s.bnpl||{}), minCartTotal: Number(e.target.value)||0 }}))} />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:6}}>
              <span>حداکثر مبلغ سبد (تومان)</span>
              <input type="number" value={settings.bnpl?.maxCartTotal||2000000} onChange={e=> setSettings(s=> ({...s, bnpl:{...(s.bnpl||{}), maxCartTotal: Number(e.target.value)||0 }}))} />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:6}}>
              <span>حداکثر تعداد طرح فعال</span>
              <input type="number" value={settings.bnpl?.maxActivePlans||30} onChange={e=> setSettings(s=> ({...s, bnpl:{...(s.bnpl||{}), maxActivePlans: Math.max(0, Number(e.target.value)||0) }}))} />
            </label>
          </div>
        ) : (
          <div style={{color:'#666'}}>در حال بارگذاری تنظیمات...</div>
        )}
        <div style={{marginTop:10}}>
          <button className="btn" disabled={saving} onClick={async()=>{
            if (!settings) return;
            setSaving(true);
            try {
              const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
              if (!token) throw new Error('ابتدا وارد شوید');
              const res = await fetch(`${BASE_API}/api/admin/settings`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ bnpl: settings.bnpl }) });
              const d = await res.json();
              if (!res.ok) throw new Error(d?.error||'خطا در ذخیره');
            } catch(e) {
              alert(e.message||'خطا');
            } finally { setSaving(false); }
          }}>ذخیره تنظیمات BNPL</button>
        </div>
      </div>

      <div className="table-scroll admin-box">
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap: 'wrap'}}>
          <input placeholder="جست‌وجو (مشتری/سفارش)" value={q} onChange={e=>{ setQ(e.target.value); setPage(1);} } style={{padding:8,border:'1px solid #ddd',borderRadius:8, minWidth: 200}} />
          <span>نمایش:</span>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          {showOverdue && (
            <span style={{color: '#e74c3c', fontWeight: 'bold', fontSize: 14}}>
              ⚠️ فقط اقساط سررسیده ({overdueRows.length} مورد)
            </span>
          )}
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>مشتری</th>
              <th>تلفن</th>
              <th>شماره سفارش</th>
              <th>پرداخت‌شده</th>
              <th>کل اقساط</th>
              <th>سررسید بعدی</th>
              <th>اقساط سررسیده</th>
              <th>بدهی</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {(showOverdue ? overdueRows : rows).length===0 ? (
              <tr><td colSpan={9}>{showOverdue ? 'اقساط سررسیده‌ای یافت نشد' : 'اطلاعاتی نیست'}</td></tr>
            ) : (showOverdue ? overdueRows : rows).map(r=> {
              const isOverdue = r.hasOverdue;
              const nextDueDate = r.nextDue !== '-' ? new Date(r.nextDue) : null;
              const isNextOverdue = nextDueDate && nextDueDate < new Date();
              
              return (
                <tr key={r.order} className={isOverdue ? 'overdue-row' : ''}>
                  <td>{r.customer}</td>
                  <td>{r.phone || '-'}</td>
                  <td>{r.orderNumber || r.order.slice(-8)}</td>
                  <td>{r.paid}</td>
                  <td>{r.total}</td>
                  <td className={isNextOverdue ? 'overdue-cell' : ''}>
                    {nextDueDate ? nextDueDate.toLocaleDateString('fa-IR') : '-'}
                    {isNextOverdue && <span className="overdue-badge">سررسیده</span>}
                  </td>
                  <td className={r.overdueCount > 0 ? 'overdue-count' : ''}>
                    {r.overdueCount > 0 ? `${r.overdueCount} قسط` : '-'}
                  </td>
                  <td>{r.remaining.toLocaleString()} تومان</td>
                  <td>
                    <span className={`status-badge status-${r.status}`}>
                      {r.status === 'active' ? 'فعال' : r.status === 'completed' ? 'تکمیل' : 'سایر'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{color:'#666',fontSize:13}}>نمایش {rows.length? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize, (page-1)*pageSize + rows.length)} از {total}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>قبلی</button>
            <button className="btn" onClick={()=>setPage(p=> ((p*pageSize<total)? p+1 : p))} disabled={page*pageSize>=total}>بعدی</button>
          </div>
        </div>
      </div>
      <style>{`
        .admin-root{max-width:1200px;margin:44px auto;background:#f8fafc;border-radius:24px;box-shadow:0 8px 48px #e2e6ea;font-family:Vazirmatn,sans-serif;padding:32px 16px}
        .admin-title{font-size:1.6rem;font-weight:700;color:#c0392b;margin:0 0 18px;text-align:center}
        .admin-icon{font-size:1.5rem;margin-left:8px}
        .admin-nav{display:flex;gap:8px;overflow-x:auto;padding:8px 4px;margin-bottom:14px}
        .nav-link{background:#fff;border:1px solid #eee;border-radius:10px;padding:8px 12px;color:#333;white-space:nowrap;text-decoration:none}
        .nav-link.active{background:var(--accent,#ff7f23);color:#fff;border-color:transparent}
        .admin-box{background:#fff;border-radius:16px;box-shadow:0 2px 16px #eee;margin-bottom:14px;padding:14px 12px}
        .table-scroll{overflow-x:auto}
        .admin-table{width:100%;background:#f8f8f8;border-radius:8px;border-collapse:collapse;font-size:13px}
        .admin-table th,.admin-table td{padding:8px 6px;border-bottom:1px solid #eee;text-align:center}
        .admin-table th{background:#eee;color:#222;font-weight:700;font-size:12px}
        
        /* آمار کارت‌ها */
        .stat-card{background:#fff;border-radius:12px;padding:16px 20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);min-width:120px}
        .stat-card.overdue{background:linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);color:#fff}
        .stat-number{font-size:24px;font-weight:bold;margin-bottom:4px}
        .stat-label{font-size:12px;opacity:0.8}
        
        /* دکمه تغییر نمایش */
        .toggle-btn{background:#3498db;color:#fff;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;font-weight:bold;transition:all 0.3s ease}
        .toggle-btn:hover{background:#2980b9;transform:translateY(-1px)}
        .toggle-btn.active{background:#e74c3c}
        
        /* ردیف‌های سررسیده */
        .overdue-row{background-color:#fdf2f2 !important}
        .overdue-row:hover{background-color:#fce4e4 !important}
        
        /* سلول‌های سررسیده */
        .overdue-cell{color:#e74c3c;font-weight:bold}
        .overdue-count{color:#e74c3c;font-weight:bold}
        
        /* نشان سررسیده */
        .overdue-badge{background:#e74c3c;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-right:4px}
        
        /* نشان وضعیت */
        .status-badge{padding:4px 8px;border-radius:6px;font-size:11px;font-weight:bold}
        .status-active{background:#27ae60;color:#fff}
        .status-completed{background:#95a5a6;color:#fff}
        
        /* دکمه‌ها */
        .btn{background:#3498db;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px}
        .btn:disabled{background:#bdc3c7;cursor:not-allowed}
        .btn:hover:not(:disabled){background:#2980b9}
      `}</style>
    </div>
  );
}



'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CouponsAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [coupons, setCoupons] = useState([]);
  const [total, setTotal] = useState(0);
  const [gateOk, setGateOk] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  // Jalali helpers (reuse minimal)
  function div(a,b){ return ~~(a/b); }
  function mod(a,b){ return a-~~(a/b)*b; }
  function jalaliToGregorian(jy, jm, jd){ jy=+jy; jm=+jm; jd=+jd; var gy; if (jy>979){ gy=1600; jy-=979; } else { gy=621; } var days = 365*jy + div(jy,33)*8 + div(mod(jy,33)+3,4); for (var i=0;i<jm-1;++i){ days += (i<6?31:30); } days += jd-1; gy += 400*div(days,146097); days = mod(days,146097); if (days>36524){ gy += 100*((--days/36524)|0); days = mod(days,36524); if (days>=365) days++; } gy += 4*div(days,1461); days = mod(days,1461); if (days>365){ gy += ((days-1)/365)|0; days = (days-1)%365; } var gd = days+1; var sal_a=[0,31,(gy%4===0&&gy%100!==0)||gy%400===0?29:28,31,30,31,30,31,31,30,31,30,31]; var gm; for(gm=0;gm<13&&gd>sal_a[gm];gm++){ gd-=sal_a[gm]; } return [gy,gm,gd]; }
  function gregorianToJalali(gy,gm,gd){ gy=+gy; gm=+gm; gd=+gd; var g_d_m=[0,31,59,90,120,151,181,212,243,273,304,334]; var jy=(gy<=1600)?0:979; gy -= (gy<=1600)?621:1600; var gy2 = gm>2?gy+1:gy; var days = 365*gy + div(gy2,4) - div(gy2,100) + div(gy2,400) - 80 + gd + g_d_m[gm-1]; jy += 33*div(days,12053); days = mod(days,12053); jy += 4*div(days,1461); days = mod(days,1461); if (days>365){ jy += div(days-1,365); days = mod(days-1,365); } var jm = (days<186)?1+div(days,31):7+div(days-186,30); var jd = 1 + mod(days,(days<186?31:30)); return [jy+1,jm,jd]; }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function jToIso(y,m,d){ const [gy,gm,gd] = jalaliToGregorian(y,m,d); return `${gy}-${pad2(gm)}-${pad2(gd)}`; }
  function todayJ(){ const t=new Date(); const [jy,jm,jd]=gregorianToJalali(t.getFullYear(), t.getMonth()+1, t.getDate()); return { y:jy, m:jm, d:jd }; }
  function jDaysInMonth(y,m){ return m<=6?31:(m<=11?30:30); }
  const monthNamesFa=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

  const [form, setForm] = useState({ code:'', percent:'', amount:'', maxUse:'', minAmount:'', active:true, categories:'', expires: todayJ() });

  async function load(){
    setErr('');
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const params = new URLSearchParams();
      if (q) params.set('q', q.trim());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`${BASE_API}/api/coupons?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error||'خطا در دریافت کدها');
      const list = d.coupons||[];
      setCoupons(list);
      setTotal(Number(d.total||list.length));
    }catch(e){ setErr(e.message||'خطا'); }
  }
  useEffect(()=>{ if (gateOk) load(); },[gateOk]);
  useEffect(()=>{ if (gateOk) { setPage(1); } },[q, pageSize]);
  useEffect(()=>{ if (gateOk) load(); },[page, pageSize, q]);

  async function createCoupon(e){
    e.preventDefault(); setMsg(''); setErr('');
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const body = {
        code: String(form.code||'').toUpperCase().trim(),
        percent: form.percent? Number(form.percent): undefined,
        amount: form.amount? Number(form.amount): undefined,
        maxUse: form.maxUse? Number(form.maxUse): undefined,
        minAmount: form.minAmount? Number(form.minAmount): undefined,
        categories: String(form.categories||'').split(',').map(s=>s.trim()).filter(Boolean),
        active: !!form.active,
        expiresAt: form.expires ? jToIso(form.expires.y, form.expires.m, form.expires.d) : undefined,
      };
      const res = await fetch(`${BASE_API}/api/coupons`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error||'ثبت کوپن ناموفق بود');
      setMsg('ثبت شد'); setForm({ code:'', percent:'', amount:'', maxUse:'', minAmount:'', active:true, categories:'', expires: todayJ() });
      load();
    }catch(e){ setErr(e.message||'خطا'); }
  }

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <h2 className="admin-title"><span className="admin-icon">🏷️</span> مدیریت کدتخفیف</h2>
      <div className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link active">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </div>

      <div className="admin-box">
        <h3 className="section-title">ایجاد کوپن</h3>
        {err && <div style={{color:'#c0392b', marginBottom:8}}>{err}</div>}
        {msg && <div style={{color:'#27ae60', marginBottom:8}}>{msg}</div>}

        <form onSubmit={createCoupon} style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:12}}>
          <input placeholder="کد" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} required />
          <input type="number" placeholder="درصد" value={form.percent} onChange={e=>setForm({...form, percent:e.target.value})} />
          <input type="number" placeholder="مبلغ ثابت" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
          <input type="number" placeholder="حداکثر استفاده" value={form.maxUse} onChange={e=>setForm({...form, maxUse:e.target.value})} />
          <input type="number" placeholder="حداقل خرید" value={form.minAmount} onChange={e=>setForm({...form, minAmount:e.target.value})} />
          <input placeholder="دسته‌ها (با ویرگول)" value={form.categories} onChange={e=>setForm({...form, categories:e.target.value})} />
          <label style={{display:'flex', alignItems:'center', gap:6}}>
            <input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active:e.target.checked})} /> فعال
          </label>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <span>انقضا (شمسی):</span>
            <select value={form.expires.y} onChange={e=>setForm({...form, expires:{...form.expires, y:Number(e.target.value)}})}>
              {Array.from({length:6},(_,i)=> todayJ().y - 0 + i).map(y=> <option key={'y'+y} value={y}>{y}</option>)}
            </select>
            <select value={form.expires.m} onChange={e=>{ const m=Number(e.target.value); const dmax=jDaysInMonth(form.expires.y,m); const d=Math.min(form.expires.d,dmax); setForm({...form, expires:{...form.expires, m, d}}); }}>
              {monthNamesFa.map((n,idx)=> <option key={'m'+idx} value={idx+1}>{n}</option>)}
            </select>
            <select value={form.expires.d} onChange={e=>setForm({...form, expires:{...form.expires, d:Number(e.target.value)}})}>
              {Array.from({length:jDaysInMonth(form.expires.y, form.expires.m)},(_,i)=>i+1).map(d=> <option key={'d'+d} value={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit">ایجاد کوپن</button>
        </form>
      </div>

      <div className="table-scroll admin-box">
        <h3 className="section-title">لیست کوپن‌ها</h3>
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
          <input placeholder="جست‌وجوی کد" value={q} onChange={e=>setQ(e.target.value)} style={{padding:8,border:'1px solid #ddd',borderRadius:8}} />
          <span>نمایش:</span>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>کد</th><th>درصد</th><th>مبلغ</th><th>تعداد استفاده</th><th>حداکثر</th><th>انقضا</th><th>حداقل خرید</th><th>فعال</th><th>دسته‌ها</th>
            </tr>
          </thead>
          <tbody>
            {(coupons||[]).length===0 ? (
              <tr><td colSpan={9}>کوپنی ثبت نشده</td></tr>
            ) : coupons.map(c => (
              <tr key={c._id||c.code}>
                <td>{c.code}</td>
                <td>{c.percent||'-'}</td>
                <td>{c.amount? Number(c.amount).toLocaleString(): '-'}</td>
                <td>{c.usedCount||0}</td>
                <td>{c.maxUse||'-'}</td>
                <td>{c.expiresAt? new Date(c.expiresAt).toLocaleDateString('fa-IR'):'-'}</td>
                <td>{c.minAmount? Number(c.minAmount).toLocaleString():'-'}</td>
                <td>{c.active? 'بله':'خیر'}</td>
                <td>{Array.isArray(c.categories)? c.categories.join('، '): '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{color:'#666',fontSize:13}}>نمایش {coupons.length? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize, (page-1)*pageSize+coupons.length)} از {total}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>قبلی</button>
            <button className="btn" onClick={()=>setPage(p=> (p*pageSize<total? p+1 : p))} disabled={page*pageSize>=total}>بعدی</button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-root{max-width:1000px;margin:44px auto;background:#f8fafc;border-radius:24px;box-shadow:0 8px 48px #e2e6ea;font-family:Vazirmatn,sans-serif;padding:32px 16px}
        .admin-title{font-size:1.6rem;font-weight:700;color:#c0392b;margin:0 0 18px;text-align:center}
        .admin-icon{font-size:1.5rem;margin-left:8px}
        .admin-nav{display:flex;gap:8px;overflow-x:auto;padding:8px 4px;margin-bottom:14px}
        .nav-link{background:#fff;border:1px solid #eee;border-radius:10px;padding:8px 12px;color:#333;white-space:nowrap;text-decoration:none}
        .nav-link.active{background:var(--accent,#ff7f23);color:#fff;border-color:transparent}
        .admin-box{background:#fff;border-radius:16px;box-shadow:0 2px 16px #eee;margin-bottom:14px;padding:14px 12px}
        .section-title{font-weight:700;color:var(--accent,#ff7f23);margin:0 0 10px}
        .table-scroll{overflow-x:auto}
        .admin-table{width:100%;background:#f8f8f8;border-radius:8px;border-collapse:collapse}
        .admin-table th,.admin-table td{padding:8px 10px;border-bottom:1px solid #eee;text-align:center}
        .admin-table th{background:#eee;color:#222;font-weight:700}
      `}</style>
    </div>
  );
}



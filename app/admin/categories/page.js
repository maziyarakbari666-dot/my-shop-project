'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CategoriesAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load(){
    setErr('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q.trim());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`${BASE_API}/api/categories?${params.toString()}`);
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'خطا');
      setList(d.categories||[]);
      setTotal(Number(d.total|| (d.categories||[]).length));
    } catch(e){ setErr(e.message||'خطا'); }
  }
  useEffect(()=>{ if (gateOk) load(); },[gateOk]);
  useEffect(()=>{ if (gateOk) { setPage(1); } },[q, pageSize]);
  useEffect(()=>{ if (gateOk) load(); },[page, pageSize, q]);

  async function add(){
    setMsg(''); setErr('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if(!token) throw new Error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/categories`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ name }) });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'خطا');
      setMsg('افزوده شد'); setName(''); load();
    } catch(e){ setErr(e.message||'خطا'); }
  }

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <h2 className="admin-title"><span className="admin-icon">🗂️</span> مدیریت دسته‌ها</h2>
      <div className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link active">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </div>

      <div className="admin-box">
        <h3 className="section-title">افزودن دسته</h3>
      {err && <div style={{color:'#c0392b'}}>{err}</div>}
      {msg && <div style={{color:'#27ae60'}}>{msg}</div>}
        <div style={{display:'flex', gap:8, marginBottom:12, flexWrap:'wrap'}}>
        <input placeholder="نام دسته" value={name} onChange={e=>setName(e.target.value)} />
          <button onClick={add}>افزودن دسته</button>
          <button onClick={load}>بروزرسانی لیست</button>
        </div>
      </div>

      <div className="table-scroll admin-box">
        <h3 className="section-title">لیست دسته‌ها</h3>
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
          <input placeholder="جست‌وجوی نام" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} style={{padding:8,border:'1px solid #ddd',borderRadius:8}} />
          <span>نمایش:</span>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <table className="admin-table" style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr><th>نام</th></tr>
          </thead>
          <tbody>
            {(() => {
              const rows = (list||[]);
              if (rows.length===0) return (<tr><td>دسته‌ای نیست</td></tr>);
              return rows.map(c => (<tr key={c._id}><td>{c.name}</td></tr>));
            })()}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          {(() => { const filteredCount = total; return (
            <>
              <div style={{color:'#666',fontSize:13}}>نمایش {list.length? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize, (page-1)*pageSize + list.length)} از {filteredCount}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>قبلی</button>
                <button className="btn" onClick={()=>setPage(p=> ((p*pageSize<filteredCount)? p+1 : p))} disabled={page*pageSize>=filteredCount}>بعدی</button>
              </div>
            </>
          ); })()}
        </div>
      </div>

      <style>{`
        .admin-root{max-width:900px;margin:44px auto;background:#f8fafc;border-radius:24px;box-shadow:0 8px 48px #e2e6ea;font-family:Vazirmatn,sans-serif;padding:32px 16px}
        .admin-title{font-size:1.6rem;font-weight:700;color:#c0392b;margin:0 0 18px;text-align:center}
        .admin-icon{font-size:1.5rem;margin-left:8px}
        .admin-nav{display:flex;gap:8px;overflow-x:auto;padding:8px 4px;margin-bottom:14px}
        .nav-link{background:#fff;border:1px solid #eee;border-radius:10px;padding:8px 12px;color:#333;white-space:nowrap;text-decoration:none}
        .nav-link.active{background:var(--accent,#ff7f23);color:#fff;border-color:transparent}
        .admin-box{background:#fff;border-radius:16px;box-shadow:0 2px 16px #eee;margin-bottom:14px;padding:14px 12px}
        .section-title{font-weight:700;color:var(--accent,#ff7f23);margin:0 0 10px}
        .admin-table th,.admin-table td{padding:8px 10px;border-bottom:1px solid #eee;text-align:center}
        .admin-table th{background:#eee;color:#222;font-weight:700}
      `}</style>
    </div>
  );
}



'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CommentsAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load(){
    setErr('');
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const params = new URLSearchParams();
      if (q) params.set('q', q.trim());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`${BASE_API}/api/products/admin/comments?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error||'خطا');
      setReviews(d.reviews||[]);
      setTotal(Number(d.total|| (d.reviews||[]).length));
    }catch(e){ setErr(e.message||'خطا'); }
  }
  useEffect(()=>{ if (gateOk) load(); },[gateOk]);
  useEffect(()=>{ if (gateOk) { setPage(1); } },[q, pageSize]);
  useEffect(()=>{ if (gateOk) load(); },[page, pageSize, q]);

  async function moderate(item, action){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/products/comments/moderate`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ productId:item.productId, index:item.index, action }) });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'خطا');
      load();
    }catch(e){ alert(e.message||'خطا'); }
  }

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <h2 className="admin-title"><span className="admin-icon">💬</span> مدیریت نظرات</h2>
      <div className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link active">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </div>
      {err && <div style={{color:'#c0392b', marginBottom:8}}>{err}</div>}
      <div className="admin-box" style={{display:'flex', gap:10, marginBottom:10, alignItems:'center', flexWrap:'wrap'}}>
        <button className="btn" onClick={load}>بارگذاری نظرات</button>
        <input placeholder="جست‌وجو (کاربر/محصول/متن)" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} style={{padding:8,border:'1px solid #ddd',borderRadius:8}} />
        <span>نمایش:</span>
        <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="table-scroll admin-box">
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>محصول</th><th>متن</th><th>وضعیت</th><th>اقدام</th></tr></thead>
          <tbody>
            {reviews.length===0 ? (<tr><td colSpan={5}>نظری نیست</td></tr>) : reviews.map((r,i)=>(
              <tr key={i}><td>{r.user}</td><td>{r.productName}</td><td>{r.text}</td><td>{r.status}</td><td>{r.status==='pending' && (<>
                <button className="btn" onClick={()=>moderate(r,'approve')}>تایید</button>
                <button className="btn danger" onClick={()=>moderate(r,'reject')}>رد</button>
              </>)}</td></tr>
            ))}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{color:'#666',fontSize:13}}>نمایش {reviews.length? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize, (page-1)*pageSize + reviews.length)} از {total}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>قبلی</button>
            <button className="btn" onClick={()=>setPage(p=> ((p*pageSize<total)? p+1 : p))} disabled={page*pageSize>=total}>بعدی</button>
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
        .table-scroll{overflow-x:auto}
        .admin-table{width:100%;background:#f8f8f8;border-radius:8px;border-collapse:collapse}
        .admin-table th,.admin-table td{padding:8px 10px;border-bottom:1px solid #eee;text-align:center}
        .admin-table th{background:#eee;color:#222;font-weight:700}
        .btn{background:linear-gradient(90deg,var(--accent,#ff7f23) 60%,#ffab4d 100%);color:#fff;border:none;border-radius:9px;padding:8px 14px;font-weight:700;cursor:pointer;box-shadow:0 1px 6px #e2e2e2}
        .btn.danger{background:#c0392b}
      `}</style>
    </div>
  );
}



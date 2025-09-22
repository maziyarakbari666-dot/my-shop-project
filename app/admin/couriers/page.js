'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CouriersAdminPage(){
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name:'', phone:'' });
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    async function gate(){
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        const res = await fetch(`${BASE_API}/api/admin/gate`, { headers:{ Authorization:`Bearer ${token}` }});
        if (res.ok) setGateOk(true); else if (typeof window!=='undefined') window.location.replace('/');
      } catch { if (typeof window!=='undefined') window.location.replace('/'); }
    }
    gate();
  },[]);

  async function load(){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/couriers`, { headers:{ Authorization:`Bearer ${token}` }});
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'خطا در دریافت پیک‌ها');
      setList(d.couriers||[]);
    }catch(e){ alert(e.message||'خطا'); }
  }
  useEffect(()=>{ if(gateOk) load(); },[gateOk]);

  async function addCourier(e){
    e.preventDefault();
    try{
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/couriers`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(form) });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'ثبت ناموفق بود');
      setForm({ name:'', phone:'' });
      await load();
    }catch(e){ alert(e.message||'خطا'); } finally { setLoading(false); }
  }

  async function toggleActive(id, active){
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/couriers/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ active }) });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'بروزرسانی ناموفق بود');
      setList(prev=> prev.map(c=> (c._id===id? d.courier : c)));
    }catch(e){ alert(e.message||'خطا'); }
  }

  async function remove(id){
    if (!confirm('حذف پیک؟')) return;
    try{
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/couriers/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      const d = await res.json();
      if(!res.ok) throw new Error(d?.error||'حذف ناموفق بود');
      setList(prev=> prev.filter(c=> c._id!==id));
    }catch(e){ alert(e.message||'خطا'); }
  }

  if (!gateOk) return null;
  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title"><span className="admin-icon">🚴‍♀️</span> مدیریت پیک‌ها</h1>
        <nav className="admin-nav">
          <Link href="/admin" className="nav-link">داشبورد</Link>
          <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
          <Link href="/admin/couriers" className="nav-link active">پیک‌ها</Link>
        </nav>
      </header>

      <form className="form" onSubmit={addCourier}>
        <div className="form-row">
          <input className="text-input" placeholder="نام پیک" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          <input className="text-input" placeholder="شماره تلفن (واتساپ)" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
          <button className="btn primary" disabled={loading}>{loading?'در حال ثبت...':'افزودن پیک'}</button>
        </div>
      </form>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>تلفن</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {list.length===0 ? (
              <tr><td colSpan={4} className="empty-row">پیکی ثبت نشده است</td></tr>
            ) : list.map(c=> (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.active?'فعال':'غیرفعال'}</td>
                <td>
                  <button className="btn" onClick={()=>toggleActive(c._id, !c.active)}>{c.active?'غیرفعال کن':'فعال کن'}</button>
                  <button className="btn danger" onClick={()=>remove(c._id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



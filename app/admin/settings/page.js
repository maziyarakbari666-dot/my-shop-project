'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SettingsAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  const [settings, setSettings] = useState({ deliveryZones: [], dailyHours: [], payments:{}, bnpl:{ minCartTotal:700000, maxCartTotal:2000000, maxActivePlans:30 }, hero:{ title:'', subtitle:'', slides:[] }, about:{ contentHtml:'' }, contact:{ phone:'', address:'', instagram:'', email:'' }, footer:{ textHtml:'', links:[] } });
  const [showAboutPreview, setShowAboutPreview] = useState(false);
  const [showFooterPreview, setShowFooterPreview] = useState(false);
  const [showHeroPreview, setShowHeroPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function loadSettings(){
    try {
      setLoading(true); setErr('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error||'خطا در دریافت تنظیمات');
      setSettings({ 
        deliveryZones: d.settings.deliveryZones||[], 
        dailyHours: d.settings.dailyHours||[],
        payments: d.settings.payments||{},
        bnpl: d.settings.bnpl || { minCartTotal:700000, maxCartTotal:2000000, maxActivePlans:30 },
        hero: d.settings.hero||{ title:'', subtitle:'', slides:[] },
        about: d.settings.about||{ contentHtml:'' },
        contact: d.settings.contact||{ phone:'', address:'', instagram:'', email:'' },
        footer: d.settings.footer||{ textHtml:'', links:[] }
      });
    } catch(e){ setErr(e.message||'خطا'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ if (gateOk) loadSettings(); },[gateOk]);

  async function save(){
    setMsg(''); setErr(''); setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      const res = await fetch(`${BASE_API}/api/admin/settings`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(settings) });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error||'خطا در ذخیره');
      setMsg('ذخیره شد');
    } catch(e){ setErr(e.message||'خطا'); }
    finally { setLoading(false); }
  }

  function Toolbar({ onCmd }){
    return (
      <div style={{display:'flex', gap:6, flexWrap:'wrap', margin:'8px 0'}}>
        {[
          {k:'b', t:'Bold'},
          {k:'i', t:'Italic'},
          {k:'h2', t:'Heading'},
          {k:'ul', t:'List'},
          {k:'a', t:'Link'},
          {k:'clear', t:'Clear'}
        ].map(btn => (
          <button type="button" key={btn.k} onClick={()=> onCmd(btn.k)} style={{padding:'6px 10px',border:'1px solid #ddd',borderRadius:8,background:'#fafafa',cursor:'pointer'}}>{btn.t}</button>
        ))}
      </div>
    );
  }

  function applyFormat(cmd, value, setValue){
    const wrap = (pre, post='') => setValue((v)=> `${pre}${v}${post}`);
    if (cmd==='b') return wrap('<strong>','</strong>');
    if (cmd==='i') return wrap('<em>','</em>');
    if (cmd==='h2') return wrap('<h2>','</h2>');
    if (cmd==='ul') return wrap('<ul>\n<li>آیتم ۱</li>\n<li>آیتم ۲</li>\n</ul>');
    if (cmd==='a') return wrap('<a href="https://">','</a>');
    if (cmd==='clear') return setValue('');
  }

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <h2 className="admin-title"><span className="admin-icon">⚙️</span> تنظیمات فروشگاه</h2>
      <div className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link active">تنظیمات</Link>
      </div>

      <div className="admin-box">
        {loading && <div>در حال بارگذاری...</div>}
        {err && <div style={{color:'#c0392b'}}>{err}</div>}
        {msg && <div style={{color:'#27ae60'}}>{msg}</div>}

        <h3 className="section-title">مناطق ارسال</h3>
        {(settings.deliveryZones||[]).map((z,idx)=> (
          <div key={idx} style={{display:'flex', gap:6, marginBottom:6}}>
            <input placeholder="نام" value={z.name} onChange={e=>{
              const copy = {...settings}; copy.deliveryZones=[...(copy.deliveryZones||[])]; copy.deliveryZones[idx]={...copy.deliveryZones[idx], name:e.target.value}; setSettings(copy);
            }} />
            <input placeholder="هزینه" type="number" value={z.fee} onChange={e=>{
              const copy = {...settings}; copy.deliveryZones=[...(copy.deliveryZones||[])]; copy.deliveryZones[idx]={...copy.deliveryZones[idx], fee:Number(e.target.value)||0}; setSettings(copy);
            }} />
            <button onClick={()=>{ const copy={...settings}; copy.deliveryZones=(copy.deliveryZones||[]).filter((_,i)=>i!==idx); setSettings(copy); }}>حذف</button>
          </div>
        ))}
        <button onClick={()=>{ const copy={...settings}; copy.deliveryZones=[...(copy.deliveryZones||[]), { name:'منطقه جدید', fee:0 }]; setSettings(copy); }}>افزودن منطقه</button>

        <h3 className="section-title" style={{marginTop:16}}>ساعات کاری</h3>
        {(settings.dailyHours||[]).map((h,idx)=> (
          <div key={idx} style={{display:'flex', gap:6, marginBottom:6}}>
            <input placeholder="روز (0-6)" type="number" min={0} max={6} value={h.day} onChange={e=>{ const copy={...settings}; copy.dailyHours=[...(copy.dailyHours||[])]; copy.dailyHours[idx]={...copy.dailyHours[idx], day:Number(e.target.value)||0}; setSettings(copy); }} />
            <input placeholder="شروع" value={h.open} onChange={e=>{ const copy={...settings}; copy.dailyHours=[...(copy.dailyHours||[])]; copy.dailyHours[idx]={...copy.dailyHours[idx], open:e.target.value}; setSettings(copy); }} />
            <input placeholder="پایان" value={h.close} onChange={e=>{ const copy={...settings}; copy.dailyHours=[...(copy.dailyHours||[])]; copy.dailyHours[idx]={...copy.dailyHours[idx], close:e.target.value}; setSettings(copy); }} />
            <button onClick={()=>{ const copy={...settings}; copy.dailyHours=(copy.dailyHours||[]).filter((_,i)=>i!==idx); setSettings(copy); }}>حذف</button>
          </div>
        ))}
        <button onClick={()=>{ const copy={...settings}; copy.dailyHours=[...(copy.dailyHours||[]), { day:0, open:'08:00', close:'18:00' }]; setSettings(copy); }}>افزودن ردیف ساعت</button>

        <div style={{marginTop:18}}>
          <button onClick={save} disabled={loading}>ذخیره تنظیمات</button>
          <button onClick={loadSettings} disabled={loading} style={{marginInlineStart:8}}>بروزرسانی</button>
        </div>
        
        <h3 className="section-title" style={{marginTop:22}}>پرداخت‌ها</h3>
        <label style={{display:'inline-flex',alignItems:'center',gap:6}}>
          <input type="checkbox" checked={settings.payments?.allowOnline!==false} onChange={e=> setSettings(s=>({...s, payments:{...s.payments, allowOnline: e.target.checked}}))} />
          اجازه پرداخت آنلاین
        </label>
        <label style={{display:'inline-flex',alignItems:'center',gap:6, marginInlineStart:12}}>
          <input type="checkbox" checked={settings.payments?.allowCOD!==false} onChange={e=> setSettings(s=>({...s, payments:{...s.payments, allowCOD: e.target.checked}}))} />
          اجازه پرداخت در محل
        </label>
        <label style={{display:'inline-flex',alignItems:'center',gap:6, marginInlineStart:12}}>
          <input type="checkbox" checked={settings.payments?.allowBNPL!==false} onChange={e=> setSettings(s=>({...s, payments:{...s.payments, allowBNPL: e.target.checked}}))} />
          اجازه خرید اعتباری (BNPL)
        </label>

        <h3 className="section-title" style={{marginTop:22}}>بنر/هیرو صفحه اصلی</h3>
        <div style={{display:'grid', gap:8}}>
          <input placeholder="عنوان" value={settings.hero?.title||''} onChange={e=> setSettings(s=> ({...s, hero:{...s.hero, title:e.target.value}}))} />
          <input placeholder="زیرعنوان" value={settings.hero?.subtitle||''} onChange={e=> setSettings(s=> ({...s, hero:{...s.hero, subtitle:e.target.value}}))} />
          <div>
            <div style={{marginBottom:6}}>آدرس تصاویر (اسلایدها):</div>
            {(settings.hero?.slides||[]).map((u,i)=> (
              <div key={i} style={{display:'flex', gap:6, marginBottom:6}}>
                <input value={u} onChange={e=>{
                  const copy={...settings}; const arr=[...(copy.hero?.slides||[])]; arr[i]=e.target.value; copy.hero={...(copy.hero||{}), slides:arr}; setSettings(copy);
                }} placeholder="https://..." />
                <button onClick={()=>{
                  const copy={...settings}; const arr=[...(copy.hero?.slides||[])]; copy.hero={...(copy.hero||{}), slides: arr.filter((_,idx)=> idx!==i)}; setSettings(copy);
                }}>حذف</button>
              </div>
            ))}
            <button onClick={()=>{ const copy={...settings}; const arr=[...(copy.hero?.slides||[])]; arr.push(''); copy.hero={...(copy.hero||{}), slides:arr}; setSettings(copy); }}>افزودن اسلاید</button>
            <div style={{marginTop:10}}>
              <button type="button" onClick={()=> setShowHeroPreview(v=>!v)}>{showHeroPreview ? 'پنهان کردن پیش‌نمایش' : 'نمایش پیش‌نمایش'}</button>
            </div>
            {showHeroPreview && (
              <div className="hero-preview">
                <div className="hero-thumbs">
                  {(settings.hero?.slides||[]).filter(Boolean).map((src, idx)=> (
                    <img key={idx} className="hero-thumb" src={src} alt={`slide-${idx+1}`} />
                  ))}
                  {(!settings.hero?.slides || settings.hero.slides.filter(Boolean).length===0) && (
                    <div className="hero-thumb hero-thumb-empty">بدون تصویر</div>
                  )}
                </div>
                <div className="hero-text">
                  <div className="hero-title">{settings.hero?.title||'عنوان بنر'}</div>
                  <div className="hero-subtitle">{settings.hero?.subtitle||'زیرعنوان بنر'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <h3 className="section-title" style={{marginTop:22}}>درباره ما</h3>
        <Toolbar onCmd={(k)=> applyFormat(k, settings.about?.contentHtml||'', (nv)=> setSettings(s=> ({...s, about:{ contentHtml: typeof nv==='function'? nv(s.about?.contentHtml||'') : nv }})))} />
        <div style={{display:'flex', gap:12, alignItems:'stretch', flexWrap:'wrap'}}>
          <div style={{flex:'1 1 340px', minWidth:260}}>
            <textarea rows={8} placeholder="محتوای HTML مجاز" value={settings.about?.contentHtml||''} onChange={e=> setSettings(s=> ({...s, about:{ contentHtml:e.target.value }}))} />
          </div>
          <div style={{flex:'1 1 340px', minWidth:260}}>
            <button type="button" onClick={()=> setShowAboutPreview(v=>!v)} style={{marginBottom:6}}>{showAboutPreview ? 'پنهان کردن پیش‌نمایش' : 'نمایش پیش‌نمایش'}</button>
            {showAboutPreview && (
              <div className="preview-box" dangerouslySetInnerHTML={{ __html: settings.about?.contentHtml||'' }} />
            )}
          </div>
        </div>

        <h3 className="section-title" style={{marginTop:22}}>تماس با ما</h3>
        <div style={{display:'grid', gap:8}}>
          <input placeholder="تلفن" value={settings.contact?.phone||''} onChange={e=> setSettings(s=> ({...s, contact:{...s.contact, phone:e.target.value}}))} />
          <input placeholder="آدرس" value={settings.contact?.address||''} onChange={e=> setSettings(s=> ({...s, contact:{...s.contact, address:e.target.value}}))} />
          <input placeholder="اینستاگرام (@username یا لینک)" value={settings.contact?.instagram||''} onChange={e=> setSettings(s=> ({...s, contact:{...s.contact, instagram:e.target.value}}))} />
          <input placeholder="ایمیل" value={settings.contact?.email||''} onChange={e=> setSettings(s=> ({...s, contact:{...s.contact, email:e.target.value}}))} />
        </div>

        <h3 className="section-title" style={{marginTop:22}}>فوتر سایت</h3>
        <Toolbar onCmd={(k)=> applyFormat(k, settings.footer?.textHtml||'', (nv)=> setSettings(s=> ({...s, footer:{...s.footer, textHtml: typeof nv==='function'? nv(s.footer?.textHtml||'') : nv }})))} />
        <div style={{display:'flex', gap:12, alignItems:'stretch', flexWrap:'wrap'}}>
          <div style={{flex:'1 1 340px', minWidth:260}}>
            <textarea rows={6} placeholder="متن HTML فوتر" value={settings.footer?.textHtml||''} onChange={e=> setSettings(s=> ({...s, footer:{...s.footer, textHtml:e.target.value}}))} />
          </div>
          <div style={{flex:'1 1 340px', minWidth:260}}>
            <button type="button" onClick={()=> setShowFooterPreview(v=>!v)} style={{marginBottom:6}}>{showFooterPreview ? 'پنهان کردن پیش‌نمایش' : 'نمایش پیش‌نمایش'}</button>
            {showFooterPreview && (
              <div className="preview-box" dangerouslySetInnerHTML={{ __html: settings.footer?.textHtml||'' }} />
            )}
          </div>
        </div>
        <div style={{marginTop:8}}>
          <div style={{marginBottom:6}}>لینک‌ها:</div>
          {(settings.footer?.links||[]).map((ln, i)=> (
            <div key={i} style={{display:'flex', gap:6, marginBottom:6}}>
              <input placeholder="متن" value={ln.label||''} onChange={e=>{
                const copy={...settings}; const arr=[...(copy.footer?.links||[])]; arr[i]={...arr[i], label:e.target.value}; copy.footer={...(copy.footer||{}), links:arr}; setSettings(copy);
              }} />
              <input placeholder="پیوند" value={ln.href||''} onChange={e=>{
                const copy={...settings}; const arr=[...(copy.footer?.links||[])]; arr[i]={...arr[i], href:e.target.value}; copy.footer={...(copy.footer||{}), links:arr}; setSettings(copy);
              }} />
              <button onClick={()=>{
                const copy={...settings}; const arr=[...(copy.footer?.links||[])]; copy.footer={...(copy.footer||{}), links: arr.filter((_,idx)=> idx!==i)}; setSettings(copy);
              }}>حذف</button>
            </div>
          ))}
          <button onClick={()=>{ const copy={...settings}; const arr=[...(copy.footer?.links||[])]; arr.push({label:'', href:''}); copy.footer={...(copy.footer||{}), links:arr}; setSettings(copy); }}>افزودن لینک</button>
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
        .section-title{font-weight:700;color:var(--accent,#ff7f23);margin:14px 0 10px}
        .preview-box{background:#fff;border:1px solid #eee;border-radius:10px;padding:10px;min-height:120px;box-shadow:0 1px 8px #f0f0f0}
        .hero-preview{margin-top:10px;border:1px dashed #ddd;border-radius:12px;padding:10px}
        .hero-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
        .hero-thumb{width:120px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #eee}
        .hero-thumb-empty{width:120px;height:70px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#888;border:1px solid #eee;border-radius:8px;font-size:.9rem}
        .hero-text{color:#333}
        .hero-title{font-weight:800;color:#663191;margin-bottom:4px}
        .hero-subtitle{color:#555}
      `}</style>
    </div>
  );
}



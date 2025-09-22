'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductsAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  const [products, setProducts] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [productFiles, setProductFiles] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', description: '' });
  const [newProductImage, setNewProductImage] = useState(null);

  useEffect(() => {
    try {
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true);
      else {
        setGateOk(false);
        if (typeof window !== 'undefined') window.location.replace('/');
      }
    } catch (_) {
      setGateOk(false);
      if (typeof window !== 'undefined') window.location.replace('/');
    }
  }, []);

  async function loadProducts(query = "") {
    try {
      const url = query ? `${BASE_API}/api/products?q=${encodeURIComponent(query)}` : `${BASE_API}/api/products`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'خطا در دریافت محصولات');
      const rows = (data.products || []).map(p => ({
        id: String(p._id || ''),
        name: p.name,
        category: p.category?.name || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        images: p.image ? [p.image] : [],
        description: p.description || '',
        discountPercent: Number(p.discountPercent) || 0,
        active: true,
        pauseTimes: []
      }));
      setRawProducts(rows);
      applyClientFilter(rows, productSearch);
    } catch (_) {
      // fallback: بدون تغییر
    }
  }

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { applyClientFilter(rawProducts, productSearch); setPage(1); }, [productSearch]);

  function applyClientFilter(list, q){
    if (!Array.isArray(list)) { setProducts([]); return; }
    const qq = String(q||'').trim();
    if (!qq) { setProducts(list); return; }
    const filtered = list.filter(p => String(p.name||'').includes(qq) || String(p.category||'').includes(qq) || String(p.description||'').includes(qq));
    setProducts(filtered);
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا با حساب ادمین وارد شوید');
      const fd = new FormData();
      fd.append('name', newProduct.name);
      fd.append('price', String(newProduct.price || 0));
      fd.append('stock', String(newProduct.stock || 0));
      fd.append('description', newProduct.description || '');
      fd.append('category', newProduct.category || '');
      if (newProductImage) fd.append('image', newProductImage);
      const res = await fetch(`${BASE_API}/api/products`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'ثبت محصول ناموفق بود');
      const p = data.product;
      setProducts(prev => [...prev, { id: String(p._id), name: p.name, category: p.category?.name || newProduct.category, price: p.price, stock: p.stock, images: [p.image], description: p.description, active: true, pauseTimes: [] }]);
      toast.success(`محصول "${newProduct.name}" افزوده شد!`);
      setNewProduct({ name: '', category: '', price: '', stock: '', description: '' });
      setNewProductImage(null);
    } catch (err) {
      // fallback دمو
      setProducts(prev => ([
        ...prev,
        {
          id: (prev.length + 1).toString(),
          name: newProduct.name,
          category: newProduct.category,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
          images: [],
          description: newProduct.description,
          active: true,
          pauseTimes: []
        }
      ]));
      toast.success(`(دمو) محصول "${newProduct.name}" افزوده شد`);
      setNewProduct({ name: '', category: '', price: '', stock: '', description: '' });
      setNewProductImage(null);
    }
  }

  async function saveProductRow(pid) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) return toast.error('ابتدا با حساب ادمین وارد شوید');
      const row = products.find(p => p.id === pid);
      if (!row) return;
      const fd = new FormData();
      fd.append('name', row.name || '');
      fd.append('price', String(row.price || 0));
      fd.append('stock', String(row.stock || 0));
      fd.append('description', row.description || '');
      fd.append('discountPercent', String(row.discountPercent || 0));
      const file = productFiles[pid];
      if (file) fd.append('image', file);
      const res = await fetch(`${BASE_API}/api/products/${pid}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'ذخیره محصول ناموفق بود');
      toast.success('ذخیره شد');
      setProducts(prev => prev.map(p => p.id === pid ? {
        ...p,
        name: data.product?.name ?? p.name,
        price: Number(data.product?.price ?? p.price),
        stock: Number(data.product?.stock ?? p.stock),
        description: data.product?.description ?? p.description,
        discountPercent: Number(data.product?.discountPercent ?? p.discountPercent),
        images: data.product?.image ? [data.product.image] : p.images,
      } : p));
      setProductFiles(prev => { const cp = { ...prev }; delete cp[pid]; return cp; });
    } catch (e) { toast.error(e.message || 'خطا در ذخیره'); }
  }

  if (!gateOk) { return null; }

  return (
    <div className="admin-root">
      <h2 className="admin-title"><span className="admin-icon">🛒</span> مدیریت محصولات</h2>
      <div className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link active">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </div>
      <div id="products" className="admin-box">
        <h3 className="section-title">مدیریت محصولات</h3>
        <div className="product-form">
          <input type="text" placeholder="جست‌وجوی محصول (نام)" value={productSearch} onChange={e=>setProductSearch(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(1); loadProducts(productSearch.trim()); } }} />
          <button className="product-form" style={{padding:'7px 12px'}} onClick={()=>{ setPage(1); loadProducts(productSearch.trim()); }}>جست‌وجو</button>
          <button className="product-form" style={{padding:'7px 12px'}} onClick={()=>{ setProductSearch(''); setPage(1); loadProducts(''); }}>نمایش همه</button>
          <span>نمایش:</span>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); loadProducts(productSearch.trim()); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <form onSubmit={handleAddProduct} className="product-form">
          <input type="text" placeholder="نام محصول" value={newProduct.name} onChange={e=>setNewProduct({ ...newProduct, name: e.target.value })} required />
          <input type="text" placeholder="دسته‌بندی" value={newProduct.category} onChange={e=>setNewProduct({ ...newProduct, category: e.target.value })} required />
          <input type="number" placeholder="قیمت" value={newProduct.price} onChange={e=>setNewProduct({ ...newProduct, price: e.target.value })} required />
          <input type="number" placeholder="موجودی" value={newProduct.stock} onChange={e=>setNewProduct({ ...newProduct, stock: e.target.value })} required />
          <input type="text" placeholder="توضیحات" value={newProduct.description} onChange={e=>setNewProduct({ ...newProduct, description: e.target.value })} required />
          <input type="file" accept="image/*" onChange={e=> setNewProductImage(e.target.files?.[0]||null)} />
          <button type="submit">افزودن محصول</button>
        </form>
        <div>
          {(products.slice((page-1)*pageSize, (page-1)*pageSize + pageSize)).map(p => (
            <div key={p.id} className="product-row">
              <input className="inl" value={p.name} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,name:e.target.value}:x))} placeholder="نام" />
              <input className="inl" value={p.category} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,category:e.target.value}:x))} placeholder="دسته" />
              <input className="inl" type="number" value={p.price} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,price:Number(e.target.value)||0}:x))} placeholder="قیمت" />
              <input className="inl" type="number" value={p.stock} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:Number(e.target.value)||0}:x))} placeholder="موجودی" />
              <input className="inl" type="number" min={0} max={100} value={p.discountPercent||0} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,discountPercent:Math.max(0,Math.min(100,Number(e.target.value)||0))}:x))} placeholder="٪تخفیف" />
              <input className="inl desc" value={p.description} onChange={e=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,description:e.target.value}:x))} placeholder="توضیحات" />
              <input className="inl" type="file" accept="image/*" onChange={e=>setProductFiles(prev=>({ ...prev, [p.id]: e.target.files?.[0]||null }))} />
              <button className="btn-approve" onClick={()=>saveProductRow(p.id)}>ذخیره</button>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
            <div style={{color:'#666',fontSize:13}}>نمایش {products.length? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize, products.length)} از {products.length}</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span>اندازه صفحه:</span>
              <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <button className="btn-approve" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>قبلی</button>
              <button className="btn-approve" onClick={()=>setPage(p=> (p*pageSize<products.length? p+1 : p))} disabled={page*pageSize>=products.length}>بعدی</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-root {
          max-width: 1100px;
          margin: 44px auto;
          background: #f8fafc;
          border-radius: 24px;
          box-shadow: 0 8px 48px #e2e6ea;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 16px;
        }
        .admin-title{font-size:1.6rem;font-weight:700;color:#c0392b;margin:0 0 18px;text-align:center}
        .admin-icon{font-size:1.5rem;margin-left:8px}
        .admin-nav{display:flex;gap:8px;overflow-x:auto;padding:8px 4px;margin-bottom:14px}
        .nav-link{background:#fff;border:1px solid #eee;border-radius:10px;padding:8px 12px;color:#333;white-space:nowrap;text-decoration:none}
        .nav-link.active{background:var(--accent,#ff7f23);color:#fff;border-color:transparent}
        .admin-box {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 16px #eee;
          margin-bottom: 34px;
          padding: 24px 18px;
          transition: box-shadow .2s;
        }
        .admin-box:hover { box-shadow: 0 8px 28px #e2e6ea; }
        .section-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--accent);
          margin-bottom: 18px;
          text-align: center;
        }
        .product-form {
          margin-bottom: 24px;
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }
        .product-form input {
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid #ddd;
          font-size: 15px;
          background: #f7f7f7;
          min-width: 120px;
        }
        .product-form input:focus { border-color: var(--accent); background: #fff4e6; }
        .product-form button {
          background: linear-gradient(90deg,var(--accent) 60%,#ffab4d 100%);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 9px 18px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 1px 6px #e2e2e2;
        }
        .product-row {
          background: #f8f8f8;
          border-radius: 9px;
          padding: 9px 13px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 15px;
          box-shadow: 0 1px 6px #eee;
        }
        .btn-approve {
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 18px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          margin-right: 7px;
          box-shadow: 0 2px 8px #eee;
        }
        .btn-approve:hover { background: #ff8c1a; }

        @media (max-width: 600px) {
          .admin-root { padding: 4px 0; }
          .admin-box { margin-bottom: 17px; padding: 8px 2px; }
          .product-form input, .product-form button { font-size: 12px; padding: 6px 7px; min-width: 70px; }
          .product-row { padding: 7px 2px; font-size: 13px; }
        }
        @media (max-width: 430px) {
          .product-form { flex-direction: column; gap: 4px; }
          .product-form input, .product-form button { width: 100%; }
        }
      `}</style>
    </div>
  );
}

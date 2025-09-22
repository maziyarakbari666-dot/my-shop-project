'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UsersAdmin() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [gateOk, setGateOk] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // admin gate
  useEffect(()=>{
    try{
      const cookies = typeof document !== 'undefined' ? document.cookie : '';
      const ok = cookies.split('; ').some(x => x.trim() === 'admin_gate=ok');
      if (ok) setGateOk(true); else { setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
    }catch(_){ setGateOk(false); if (typeof window !== 'undefined') window.location.replace('/'); }
  },[]);

  async function loadUsers() {
    setError('');
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      
      const qs = new URLSearchParams();
      if (q && q.trim()) qs.set('q', q.trim());
      qs.set('page', String(page));
      qs.set('pageSize', String(pageSize));
      
      const res = await fetch(`${BASE_API}/api/users/all?${qs.toString()}`, { 
        headers:{ Authorization:`Bearer ${token}` } 
      });
      const d = await res.json();
      
      if(!res.ok) throw new Error(d?.error||'خطا در دریافت کاربران');
      
      setUsers(d.users || []);
      setTotal(Number(d.total || 0));
    } catch(e) { 
      setError(e.message||'خطا'); 
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      
      const res = await fetch(`${BASE_API}/api/users/export-excel`, { 
        headers:{ Authorization:`Bearer ${token}` } 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || 'خطا در دانلود فایل');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) { 
      alert('دانلود فایل ناموفق بود: ' + e.message); 
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId, currentStatus) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      if (!token) throw new Error('ابتدا وارد شوید');
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const res = await fetch(`${BASE_API}/api/users/${userId}/status`, { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'خطا در تغییر وضعیت');
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, status: newStatus } : u
      ));
      
    } catch(e) { 
      alert('تغییر وضعیت ناموفق بود: ' + e.message); 
    }
  }

  useEffect(()=>{ if (gateOk) loadUsers(); },[gateOk]);
  useEffect(()=>{ if (gateOk) loadUsers(); },[page, pageSize]);

  if (!gateOk) return null;

  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title">
          <span className="admin-icon">👥</span> 
          مدیریت کاربران
        </h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{total}</span>
            <span className="stat-label">کل کاربران</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{users.filter(u => u.status === 'active').length}</span>
            <span className="stat-label">فعال</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{users.filter(u => u.status === 'inactive').length}</span>
            <span className="stat-label">غیرفعال</span>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <Link href="/admin" className="nav-link">داشبورد</Link>
        <Link href="/admin/orders" className="nav-link">سفارش‌ها</Link>
        <Link href="/admin/products" className="nav-link">محصولات</Link>
        <Link href="/admin/coupons" className="nav-link">کدتخفیف</Link>
        <Link href="/admin/categories" className="nav-link">دسته‌ها</Link>
        <Link href="/admin/comments" className="nav-link">نظرات</Link>
        <Link href="/admin/bnpl" className="nav-link">BNPL</Link>
        <Link href="/admin/users" className="nav-link active">کاربران</Link>
        <Link href="/admin/settings" className="nav-link">تنظیمات</Link>
      </nav>

      {/* فیلترها و جست‌وجو */}
      <div className="filters-section">
        <div className="search-row">
          <div className="search-group">
            <label>🔍</label>
            <input 
              className="search-input"
              placeholder="جست‌وجو در نام، ایمیل یا شماره تلفن..." 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(1); loadUsers(); } }} 
            />
          </div>
          <button className="btn primary" onClick={()=>{ setPage(1); loadUsers(); }} disabled={loading}>
            {loading ? 'در حال جست‌وجو...' : 'جست‌وجو'}
          </button>
        </div>

        <div className="action-row">
          <button className="btn secondary" onClick={loadUsers} disabled={loading}>
            🔄 بروزرسانی
          </button>
          <button className="btn export" onClick={exportExcel} disabled={loading}>
            📊 دانلود اکسل مشتریان
          </button>
          <div className="filter-group">
            <label>نمایش:</label>
            <select 
              className="filter-select" 
              value={pageSize} 
              onChange={e=>{ setPageSize(Number(e.target.value)||20); setPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {/* جدول کاربران */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>نام و نام خانوادگی</th>
                <th>ایمیل</th>
                <th>شماره تماس</th>
                <th>تعداد سفارشات</th>
                <th>آخرین سفارش</th>
                <th>تاریخ عضویت</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-row">
                    <div className="loading-content">
                      <span className="loading-icon">⏳</span>
                      <span>در حال بارگذاری...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    <div className="empty-content">
                      <span className="empty-icon">👥</span>
                      <span>کاربری یافت نشد</span>
                    </div>
                  </td>
                </tr>
              ) : users.map(user => {
                const lastOrderDate = user.lastOrderDate 
                  ? new Date(user.lastOrderDate).toLocaleDateString('fa-IR')
                  : 'ندارد';
                const joinDate = user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('fa-IR')
                  : '-';
                
                return (
                  <tr key={user._id} className="user-row">
                    <td className="user-name">{user.name || '-'}</td>
                    <td className="user-email">{user.email || '-'}</td>
                    <td className="user-phone">{user.phone || '-'}</td>
                    <td className="order-count">
                      <span className="count-badge">{user.ordersCount || 0}</span>
                    </td>
                    <td className="last-order">{lastOrderDate}</td>
                    <td className="join-date">{joinDate}</td>
                    <td className="status">
                      <span className={`status-badge status-${user.status || 'active'}`}>
                        {user.status === 'active' ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className={`btn status-toggle ${user.status === 'active' ? 'deactivate' : 'activate'}`}
                        onClick={() => toggleUserStatus(user._id, user.status || 'active')}
                      >
                        {user.status === 'active' ? '🚫 غیرفعال' : '✅ فعال'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              نمایش {((page-1)*pageSize+1)} تا {Math.min(page*pageSize, total)} از {total} کاربر
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
        )}
      </div>

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
          min-width: 80px;
        }

        .action-row {
          display: flex;
          gap: 12px;
          align-items: center;
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

        .btn.status-toggle {
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 6px;
        }

        .btn.activate {
          background: #27ae60;
          color: white;
        }

        .btn.deactivate {
          background: #e74c3c;
          color: white;
        }

        .btn:hover:not(:disabled) {
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

        /* Users Table */
        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 900px;
        }

        .users-table th {
          background: #f8f9fa;
          color: #495057;
          font-weight: 600;
          padding: 12px 8px;
          text-align: center;
          border-bottom: 1px solid #dee2e6;
          position: sticky;
          top: 0;
          z-index: 10;
          font-size: 11px;
        }

        .users-table td {
          padding: 8px;
          border-bottom: 1px solid #f1f3f4;
          vertical-align: middle;
          text-align: center;
          font-size: 11px;
        }

        .user-row {
          transition: all 0.2s ease;
        }

        .user-row:hover {
          background-color: #f1f3f4;
        }

        /* Table Cells */
        .user-name {
          font-weight: 600;
          color: #2c3e50;
          min-width: 120px;
        }

        .user-email {
          color: #6c757d;
          direction: ltr;
          min-width: 150px;
        }

        .user-phone {
          direction: ltr;
          font-family: 'Courier New', monospace;
          min-width: 100px;
        }

        .order-count {
          min-width: 80px;
        }

        .count-badge {
          background: #3498db;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 10px;
        }

        .last-order, .join-date {
          min-width: 90px;
          color: #6c757d;
        }

        .status {
          min-width: 80px;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }

        .status-active {
          background: #d4edda;
          color: #155724;
        }

        .status-inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .actions {
          min-width: 100px;
        }

        /* Empty & Loading States */
        .empty-row, .loading-row {
          height: 150px;
        }

        .empty-content, .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #6c757d;
        }

        .empty-icon, .loading-icon {
          font-size: 2.5rem;
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
          
          .pagination { 
            flex-direction: column; 
            gap: 12px; 
          }
        }
      `}</style>
    </div>
  );
}

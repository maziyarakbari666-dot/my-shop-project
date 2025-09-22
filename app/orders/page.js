'use client';

import Link from "next/link";
import React, { useEffect, useState } from 'react';

const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// دمو: سفارش‌ها
const mockOrders = [
  {
    id: "ORD123456",
    date: "1404/06/10",
    time: "9 تا 10",
    total: 145000,
    status: "در حال آماده‌سازی",
  },
  {
    id: "ORD123457",
    date: "1404/06/03",
    time: "13 تا 14",
    total: 84000,
    status: "ارسال شده",
  },
  {
    id: "ORD123458",
    date: "1404/05/28",
    time: "10 تا 11",
    total: 213000,
    status: "تحویل داده شد",
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState({});
  const statusFa = { pending: 'در انتظار پرداخت', paid: 'پرداخت شده', shipped: 'ارسال شده', delivered: 'تکمیل شده', cancelled: 'لغو شده' };

  useEffect(()=>{
    (async()=>{
      try{
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        if (!token) return;
        const r = await fetch(`${BASE_API}/api/orders?page=${page}&pageSize=${pageSize}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) { setOrders(d.orders||[]); setTotal(Number(d.total||0)); }
      }catch(_){ }
    })();
  }, [page, pageSize]);

  return (
    <div className="orders-root">
      <h2 className="orders-title">سفارش‌های من</h2>
      {orders.length === 0 ? (
        <div className="orders-empty">هنوز سفارشی ثبت نکرده‌اید!</div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-id">کد سفارش: <b>{order.orderNumber || order._id}</b></div>
              <div className="order-compact">
                <div>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</span>
                  {" | "}
                  <span className="order-time">{order.deliverySlot || '-'}</span>
                </div>
                <div className="order-total">مبلغ کل: {Number(order.totalPrice||0).toLocaleString()} تومان</div>
                <div className={`order-status`}>{statusFa[order.status] || order.status}</div>
                <button className="order-details-btn" onClick={()=>setExpanded(prev=>({ ...prev, [order._id]: !prev[order._id] }))}>
                  {expanded[order._id] ? 'بستن جزئیات' : 'جزئیات سفارش'}
                </button>
              </div>
              {expanded[order._id] && (
                <div className="order-details">
                  <div className="od-row"><span>روش پرداخت:</span> <b>{order.paymentMethod==='bnpl' ? 'اعتباری' : (order.paymentMethod==='cod'?'در محل':'آنلاین')}</b></div>
                  <div className="od-row"><span>بازه تحویل:</span> <b>{order.deliverySlot || '-'}</b></div>
                  <div className="od-row"><span>آدرس:</span> <b>{order.address||'-'}</b></div>
                  <div className="od-row"><span>منطقه:</span> <b>{order.region||'-'}</b> <span style={{marginRight:8}}>پلاک:</span> <b>{order.plaque||'-'}</b> <span style={{marginRight:8}}>واحد:</span> <b>{order.unit||'-'}</b></div>
                  <div className="od-items">
                    {(order.products||[]).map((op, idx) => (
                      <div key={op.product?._id||idx} className="od-item">
                        <span>{op.product?.name||'کالا'}</span>
                        <span>× {op.quantity}</span>
                        <span>{(Number(op.price||0) * Number(op.quantity||0)).toLocaleString()} تومان</span>
                      </div>
                    ))}
                  </div>
                  <div className="od-summary">
                    <div><span>تخفیف استفاده‌شده:</span> <b>{Number(order.discount||0).toLocaleString()} تومان</b></div>
                    <div><span>هزینه ارسال:</span> <b>{Number(order.deliveryFee||0).toLocaleString()} تومان</b></div>
                    <div className="od-total">مبلغ کل سفارش: <b>{Number(order.totalPrice||0).toLocaleString()} تومان</b></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <div style={{color:'#666',fontSize:13}}>نمایش {orders.length? ((page-1)*pageSize+1):0} تا {Math.min(page*pageSize,(page-1)*pageSize+orders.length)} از {total}</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span>اندازه صفحه:</span>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||10); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>قبلی</button>
          <button onClick={()=>setPage(p=> (p*pageSize<total? p+1 : p))} disabled={page*pageSize>=total}>بعدی</button>
        </div>
      </div>
      <style>{`
        .orders-root {
          max-width: 700px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 27px 14px;
          font-family: Vazirmatn,sans-serif;
        }
        .orders-title {
          font-size: 1.3rem;
          color: var(--brand-purple-2,#663191);
          font-weight: bold;
          margin-bottom: 24px;
          text-align: center;
        }
        .orders-empty {
          color: #888;
          font-size: 1.1rem;
          text-align: center;
          margin: 43px 0;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .order-card {
          background: #f8fafc;
          border-radius: 14px;
          box-shadow: 0 2px 14px #eee;
          padding: 17px 13px;
          text-decoration: none;
          color: inherit;
          display: block;
          transition: box-shadow .2s, transform .2s;
          cursor: pointer;
        }
        .order-card:hover {
          box-shadow: 0 8px 28px #e2e6ea;
          transform: translateY(-2px) scale(1.03);
        }
        .order-id {
          font-size: 1.07rem;
          color: var(--brand-purple-2,#663191);
          margin-bottom: 7px;
        }
        .order-date, .order-time {
          color: var(--brand-purple-1,#7156A5);
          font-size: 1rem;
        }
        .order-total {
          color: var(--brand-orange-2,#F26826);
          font-weight: bold;
          margin-top: 7px;
          font-size: 1.05rem;
        }
        .order-status {
          font-size: 1rem;
          margin-top: 7px;
          font-weight: bold;
        }
        .order-compact{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
        .order-details-btn{background:#fff;border:1px solid #e6f2ec;border-radius:8px;padding:6px 10px;cursor:pointer;color:#2d6a4f;font-weight:700}
        .order-details{background:#fff;border:1px solid #e6f2ec;border-radius:10px;padding:8px 10px;margin-top:6px}
        .od-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;color:#2d6a4f}
        .od-items{display:flex;flex-direction:column;gap:6px;margin-top:6px}
        .od-item{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed #eef5f1;padding-bottom:4px}
        .od-summary{display:flex;flex-direction:column;gap:6px;margin-top:8px}
        .od-total{color: var(--brand-purple-2,#663191);font-weight:900}
        @media (max-width: 600px) {
          .orders-root { padding: 9px 2px;}
          .order-card { padding: 9px 5px;}
        }
      `}</style>
    </div>
  );
}
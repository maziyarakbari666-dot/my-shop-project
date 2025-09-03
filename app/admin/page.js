'use client';

import React, { useState } from "react";
import toast from "react-hot-toast";

// دمو محصولات
const productsDemo = [
  {
    id: "1",
    name: "نان تست",
    category: "نان",
    price: 20000,
    stock: 15,
    images: ["/demo/bread1.jpg"],
    description: "نان تست تازه و سنتی",
    active: true,
    pauseTimes: []
  },
  {
    id: "2",
    name: "شیرینی خامه‌ای",
    category: "شیرینی",
    price: 50000,
    stock: 8,
    images: ["/demo/cake1.jpg"],
    description: "شیرینی خامه‌ای با طعم عالی",
    active: true,
    pauseTimes: [{ from: "10:00", to: "12:00" }]
  }
];

const ordersDemo = [
  {
    id: "ORD-101",
    customer: "سمیرا",
    phone: "09121234567",
    address: "تهران، آزادی، پلاک 12، واحد 3",
    date: "1402/06/10",
    receiveTime: "1402/06/12 - 10 تا 11",
    status: "پرداخت شده",
    products: [
      { name: "نان تست", qty: 2 },
      { name: "شیرینی خامه‌ای", qty: 1 }
    ],
    amount: 90000,
    paymentType: "الکترونیکی"
  }
];

const couponsDemo = [
  {
    code: "OFF30",
    percent: 30,
    expires: "1402/07/01",
    used: 4,
    maxUse: 10,
    minAmount: 60000,
    categories: ["نان", "شیرینی"]
  }
];

const commentsDemo = [
  { id: 1, user: "مهدی", text: "عالی بود", product: "نان تست", status: "pending" },
  { id: 2, user: "فرزانه", text: "طعم خوب", product: "شیرینی خامه‌ای", status: "approved" }
];

const bnplDemo = [
  { customer: "سمیرا", order: "ORD-102", paid: 2, total: 4, nextDue: "1402/07/01", remaining: 40000 }
];

export default function AdminPage() {
  const [products, setProducts] = useState(productsDemo);
  const [orders] = useState(ordersDemo);
  const [coupons] = useState(couponsDemo);
  const [comments, setComments] = useState(commentsDemo);
  const [bnpl] = useState(bnplDemo);

  // افزودن محصول دمو
  const [newProduct, setNewProduct] = useState({
    name: "", category: "", price: "", stock: "", description: ""
  });

  function handleAddProduct(e) {
    e.preventDefault();
    setProducts([
      ...products,
      {
        id: (products.length + 1).toString(),
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        images: [],
        description: newProduct.description,
        active: true,
        pauseTimes: []
      }
    ]);
    toast.success(`محصول "${newProduct.name}" با موفقیت افزوده شد!`);
    setNewProduct({ name: "", category: "", price: "", stock: "", description: "" });
  }

  function handleApproveComment(id) {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: "approved" } : c
    ));
    toast.success("نظر تایید شد!");
  }
  function handleRejectComment(id) {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: "rejected" } : c
    ));
    toast.error("نظر رد شد!");
  }

  return (
    <div className="admin-root">
      <h2 className="admin-title">
        <span className="admin-icon">🛒</span> پنل مدیریت فروشگاه
      </h2>

      {/* باکس آمار کلی */}
      <div className="admin-stats">
        <div className="stat-box">
          <span>📦</span>
          <div>محصولات</div>
          <b>{products.length}</b>
        </div>
        <div className="stat-box">
          <span>📝</span>
          <div>سفارش‌ها</div>
          <b>{orders.length}</b>
        </div>
        <div className="stat-box">
          <span>💬</span>
          <div>نظرات</div>
          <b>{comments.length}</b>
        </div>
        <div className="stat-box">
          <span>🏷️</span>
          <div>کد تخفیف</div>
          <b>{coupons.length}</b>
        </div>
      </div>

      {/* مدیریت محصولات */}
      <div className="admin-box">
        <h3 className="section-title">مدیریت محصولات</h3>
        <form onSubmit={handleAddProduct} className="product-form">
          <input type="text" placeholder="نام محصول"
            value={newProduct.name}
            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
            required />
          <input type="text" placeholder="دسته‌بندی"
            value={newProduct.category}
            onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
            required />
          <input type="number" placeholder="قیمت"
            value={newProduct.price}
            onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
            required />
          <input type="number" placeholder="موجودی"
            value={newProduct.stock}
            onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
            required />
          <input type="text" placeholder="توضیحات"
            value={newProduct.description}
            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
            required />
          <button type="submit">افزودن محصول</button>
        </form>
        <div>
          {products.map(p => (
            <div key={p.id} className="product-row">
              <span className="product-name">{p.name}</span>
              <span className="product-cat">{p.category}</span>
              <span className="product-price">{p.price.toLocaleString()} تومان</span>
              <span className="product-stock">موجودی: {p.stock}</span>
              <span className="product-desc">{p.description}</span>
              <span className={`product-status ${p.active ? "active" : "inactive"}`}>
                {p.active ? "فعال" : "غیرفعال"}
              </span>
              <span className="product-pause">
                وقفه فروش: {p.pauseTimes.length > 0 ? p.pauseTimes.map(pt => `${pt.from} تا ${pt.to}`).join(", ") : "ندارد"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* مدیریت سفارش‌ها */}
      <div className="admin-box">
        <h3 className="section-title">مدیریت سفارش‌ها</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>کد سفارش</th><th>نام مشتری</th><th>تلفن</th><th>آدرس</th>
                <th>تاریخ دریافت</th><th>وضعیت</th><th>محصولات</th><th>جمع کل</th><th>پرداخت</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.phone}</td>
                  <td>{order.address}</td>
                  <td>{order.receiveTime}</td>
                  <td className="order-status">{order.status}</td>
                  <td>{order.products.map(p => `${p.name} ×${p.qty}`).join(", ")}</td>
                  <td>{order.amount.toLocaleString()} تومان</td>
                  <td>{order.paymentType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدیریت کد تخفیف */}
      <div className="admin-box">
        <h3 className="section-title">مدیریت کد تخفیف</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>کد</th><th>درصد</th><th>تعداد استفاده</th><th>حداکثر استفاده</th><th>انقضا</th>
                <th>حداقل خرید</th><th>دسته‌ها</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.code}>
                  <td>{c.code}</td>
                  <td>{c.percent}%</td>
                  <td>{c.used}</td>
                  <td>{c.maxUse}</td>
                  <td>{c.expires}</td>
                  <td>{c.minAmount.toLocaleString()} تومان</td>
                  <td>{c.categories.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدیریت نظرات */}
      <div className="admin-box">
        <h3 className="section-title">مدیریت نظرات کاربران</h3>
        {comments.length === 0 ? (
          <div className="empty-text">نظری وجود ندارد.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="comment-row">
              <span>
                <b>{c.user}</b> درباره <b>{c.product}</b>: {c.text}
              </span>
              <span className={`comment-status ${c.status}`}>
                {c.status === "approved" ? "تایید شده" : c.status === "pending" ? "در انتظار تایید" : "رد شده"}
              </span>
              {c.status === "pending" && (
                <span>
                  <button className="btn-approve" onClick={() => handleApproveComment(c.id)}>
                    تایید
                  </button>
                  <button className="btn-reject" onClick={() => handleRejectComment(c.id)}>
                    رد
                  </button>
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* مدیریت BNPL */}
      <div className="admin-box admin-bnpl">
        <h3 className="section-title">مدیریت خرید اعتباری (BNPL)</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>مشتری</th><th>کد سفارش</th><th>اقساط پرداخت‌شده</th><th>کل اقساط</th>
                <th>سررسید بعدی</th><th>مانده بدهی</th>
              </tr>
            </thead>
            <tbody>
              {bnpl.map(b => (
                <tr key={b.order}>
                  <td>{b.customer}</td>
                  <td>{b.order}</td>
                  <td>{b.paid}</td>
                  <td>{b.total}</td>
                  <td>{b.nextDue}</td>
                  <td>{b.remaining.toLocaleString()} تومان</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* استایل مدرن و ریسپانسیو */}
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
        .admin-title {
          font-size: 2rem;
          font-weight: bold;
          color: #c0392b;
          margin-bottom: 28px;
          text-align: center;
          letter-spacing: 1px;
        }
        .admin-icon {
          font-size: 2rem;
          margin-left: 7px;
        }
        .admin-stats {
          display: flex;
          gap: 22px;
          margin-bottom: 36px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .stat-box {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 18px #eee;
          padding: 22px 24px;
          text-align: center;
          min-width: 130px;
          font-size: 1.07rem;
          color: #444;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-box > span {
          font-size: 1.5rem;
          margin-bottom: 7px;
        }
        .stat-box b {
          color: #27ae60;
          font-size: 1.2rem;
          margin-top: 4px;
        }
        .admin-box {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 16px #eee;
          margin-bottom: 34px;
          padding: 24px 18px;
          transition: box-shadow .2s;
        }
        .admin-box:hover {
          box-shadow: 0 8px 28px #e2e6ea;
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 18px;
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
        .product-form input:focus {
          border-color: #27ae60;
          background: #eafaf1;
        }
        .product-form button {
          background: linear-gradient(90deg,#27ae60 60%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 9px 18px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 1px 6px #e2e2e2;
          transition: background .2s;
        }
        .product-form button:hover {
          background: linear-gradient(90deg,#219150 60%,#43e97b 100%);
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
        .product-name { font-weight: bold; color: #213e32; min-width: 86px; }
        .product-cat { font-size: 15px; color: #27ae60; }
        .product-price { color: #e67e22; min-width: 80px; font-weight: bold;}
        .product-stock { color: #27ae60; font-size: 15px;}
        .product-desc { font-size: 14px; color: #888; }
        .product-status.active { color: #27ae60; font-weight: bold; }
        .product-status.inactive { color: #c0392b; font-weight: bold; }
        .product-pause { color: #888; font-size: 13px; }
        .table-scroll {
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          background: #f8f8f8;
          border-radius: 8px;
          margin-bottom: 10px;
          font-size: 15px;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #eee;
          text-align: center;
        }
        .admin-table th {
          background: #eee;
          color: #222;
          font-weight: bold;
        }
        .admin-table tbody tr:last-child td {
          border-bottom: none;
        }
        .order-status {
          color: #27ae60;
          font-weight: bold;
        }
        .empty-text {
          color: #b0b0b0;
          font-size: 1rem;
          text-align: center;
          margin-bottom: 10px;
        }
        .comment-row {
          background: #f8f8f8;
          border-radius: 8px;
          padding: 10px 13px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 15px;
          box-shadow: 0 1px 6px #eee;
        }
        .comment-status.approved { color: #27ae60; font-weight: bold; margin-left: 14px; }
        .comment-status.pending { color: #e67e22; font-weight: bold; margin-left: 14px; }
        .comment-status.rejected { color: #c0392b; font-weight: bold; margin-left: 14px; }
        .btn-approve {
          background: #27ae60;
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
        .btn-approve:hover {
          background: #219150;
        }
        .btn-reject {
          background: #c0392b;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 18px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
        }
        .btn-reject:hover {
          background: #a93226;
        }
        .admin-bnpl {
          background: linear-gradient(90deg,#f0f7f4 70%,#f8fafc 100%);
          border: 1.5px dashed #27ae60;
        }

        /* ریسپانسیو */
        @media (max-width: 950px) {
          .admin-root {
            padding: 13px 2px;
          }
          .admin-title {
            font-size: 1.3rem;
          }
          .admin-box {
            padding: 14px 3px;
          }
          .stat-box {
            min-width: 90px;
            padding: 9px 10px;
            font-size: 0.91rem;
          }
        }
        @media (max-width: 600px) {
          .admin-root {
            padding: 4px 0;
          }
          .admin-title {
            font-size: 1.1rem;
          }
          .admin-box {
            margin-bottom: 17px;
            padding: 8px 2px;
          }
          .product-form input, .product-form button {
            font-size: 12px;
            padding: 6px 7px;
            min-width: 70px;
          }
          .product-row {
            padding: 7px 2px;
            font-size: 13px;
          }
          .admin-table th, .admin-table td {
            padding: 5px 4px;
            font-size: 12px;
          }
          .comment-row, .btn-approve, .btn-reject {
            font-size: 12px;
            padding: 5px 7px;
          }
        }
        @media (max-width: 430px) {
          .product-form {
            flex-direction: column;
            gap: 4px;
          }
          .product-form input, .product-form button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
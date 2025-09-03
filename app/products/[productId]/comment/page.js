'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// دمو: اطلاعات محصول برای نمایش
const mockProduct = {
  id: "bread-toast",
  name: "نان تست",
  image: "/images/bread-toast.jpg",
};

export default function ProductCommentPage() {
  const params = useParams();
  // در حالت واقعی: بر اساس params.productId اطلاعات محصول را fetch کن!
  const product = mockProduct;

  const [rate, setRate] = useState(5);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(true);
    // در حالت واقعی: ارسال نظر و امتیاز به API
  }

  return (
    <div className="product-comment-root">
      <h2 className="product-comment-title">ثبت نظر برای محصول <b>{product.name}</b></h2>
      <div className="product-info">
        <img src={product.image} alt={product.name} className="product-img" />
        <div className="product-name">{product.name}</div>
      </div>
      {!success ? (
        <form className="product-comment-form" onSubmit={handleSubmit}>
          <div className="rate-row">
            <label>امتیاز شما:</label>
            <div className="rate-stars">
              {[1,2,3,4,5].map(n => (
                <span
                  key={n}
                  className={n <= rate ? "star-filled" : "star-empty"}
                  onClick={() => setRate(n)}
                  style={{cursor:"pointer", fontSize:"24px"}}
                  title={`امتیاز ${n}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>متن نظر:</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="نظر خود را درباره محصول بنویسید..."
              required
            />
          </div>
          <button type="submit" className="product-comment-btn">ثبت نظر</button>
        </form>
      ) : (
        <div className="product-comment-success">
          ✅ نظر شما با موفقیت ثبت شد!
          <div style={{ marginTop: 22 }}>
            <Link href={`/products/${product.id}`}>بازگشت به صفحه محصول</Link>
          </div>
        </div>
      )}
      <style>{`
        .product-comment-root {
          max-width: 430px;
          margin: 44px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .product-comment-title {
          font-weight: bold;
          font-size: 22px;
          color: #27ae60;
          margin-bottom: 20px;
          text-align: center;
        }
        .product-info {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #f8fafc;
          border-radius: 13px;
          padding: 7px 13px;
          margin-bottom: 13px;
        }
        .product-img {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          object-fit: cover;
          background: #eee;
        }
        .product-name {
          font-size: 18px;
          color: #3498db;
          font-weight: bold;
        }
        .product-comment-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .rate-row label {
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 8px;
        }
        .rate-stars {
          display: flex;
          gap: 4px;
          margin-top: 3px;
        }
        .star-filled {
          color: #f39c12;
          text-shadow: 0 1px 2px #eee;
        }
        .star-empty {
          color: #ddd;
        }
        .form-row label {
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 8px;
        }
        .form-row textarea {
          width: 100%;
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid #eee;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
        }
        .product-comment-btn {
          background: linear-gradient(90deg,#27ae60 70%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 0;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
          transition: background .2s;
          margin-top: 13px;
        }
        .product-comment-success {
          color: #27ae60;
          font-size: 21px;
          text-align: center;
          margin-top: 55px;
          font-family: Vazirmatn,sans-serif;
        }
        .product-comment-success a {
          color: #27ae60;
          font-weight: bold;
          text-decoration: none;
        }
        .product-comment-success a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .product-comment-root { padding: 11px 2px; }
          .product-comment-title { font-size: 18px; }
          .product-comment-btn { padding: 9px 0; font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
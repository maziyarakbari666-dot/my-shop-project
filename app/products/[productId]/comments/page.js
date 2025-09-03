'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";

// دمو: لیست اولیه نظرات مربوط به یک محصول
const initialComments = [
  {
    id: 1,
    user: "علی",
    rate: 5,
    comment: "نان تست فوق‌العاده بود. تازه و خوشمزه!",
    date: "1404/06/14",
    reply: "خیلی خوشحالیم دوست داشتید. ممنون از اعتماد شما!",
    likes: 4,
    dislikes: 0,
    reported: false,
  },
  {
    id: 2,
    user: "سارا",
    rate: 4,
    comment: "بسته‌بندی خوب بود اما می‌توانست بهتر باشد.",
    date: "1404/06/15",
    reply: "حتما روی بسته‌بندی بهبود خواهیم داد. سپاس از بازخوردتون.",
    likes: 2,
    dislikes: 1,
    reported: false,
  },
  {
    id: 3,
    user: "محسن",
    rate: 3,
    comment: "ارسال کمی دیر انجام شد، اما کیفیت عالی بود.",
    date: "1404/06/16",
    reply: null,
    likes: 0,
    dislikes: 0,
    reported: false,
  },
];

// تعداد نظرات در هر صفحه (pagination)
const COMMENTS_PER_PAGE = 2;

export default function ProductCommentsPage() {
  const params = useParams();

  // حالت‌ها
  const [comments, setComments] = useState(initialComments);
  const [search, setSearch] = useState("");
  const [rateFilter, setRateFilter] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editRate, setEditRate] = useState(5);
  const [replyEditId, setReplyEditId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentRate, setNewCommentRate] = useState(5);
  const [newCommentUser, setNewCommentUser] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // اعمال جستجو و فیلتر
  const filteredComments = comments.filter(c =>
    (rateFilter === 0 || c.rate === rateFilter) &&
    (search === "" ||
      c.comment.includes(search) ||
      (c.reply && c.reply.includes(search)) ||
      c.user.includes(search)
    )
  );

  // صفحه‌بندی
  const pageCount = Math.ceil(filteredComments.length / COMMENTS_PER_PAGE);
  const pagedComments = filteredComments.slice(
    (currentPage - 1) * COMMENTS_PER_PAGE,
    currentPage * COMMENTS_PER_PAGE
  );

  // ثبت نظر جدید
  function handleAddComment(e) {
    e.preventDefault();
    if (!newCommentUser || !newCommentText) return;
    const newId = comments.length ? Math.max(...comments.map(c => c.id)) + 1 : 1;
    setComments([
      ...comments,
      {
        id: newId,
        user: newCommentUser,
        rate: newCommentRate,
        comment: newCommentText,
        date: new Date().toLocaleDateString("fa-IR"),
        reply: null,
        likes: 0,
        dislikes: 0,
        reported: false,
      },
    ]);
    setNewCommentText("");
    setNewCommentRate(5);
    setNewCommentUser("");
    setCurrentPage(pageCount); // برو آخرین صفحه
  }

  // حذف نظر
  function handleDelete(id) {
    if (window.confirm("آیا مطمئن هستید که می‌خواهید این نظر را حذف کنید؟")) {
      setComments(comments.filter(c => c.id !== id));
    }
  }

  // ویرایش نظر
  function handleEdit(id, comment, rate) {
    setEditId(id);
    setEditText(comment);
    setEditRate(rate);
  }
  function handleEditSave() {
    setComments(comments.map(c =>
      c.id === editId ? { ...c, comment: editText, rate: editRate } : c
    ));
    setEditId(null);
    setEditText("");
    setEditRate(5);
  }
  function handleEditCancel() {
    setEditId(null);
    setEditText("");
    setEditRate(5);
  }

  // پاسخ مدیریت
  function handleReply(id, reply) {
    setReplyEditId(id);
    setReplyText(reply || "");
  }
  function handleReplySave() {
    setComments(comments.map(c =>
      c.id === replyEditId ? { ...c, reply: replyText } : c
    ));
    setReplyEditId(null);
    setReplyText("");
  }
  function handleReplyCancel() {
    setReplyEditId(null);
    setReplyText("");
  }

  // Like/Dislike
  function handleLike(id) {
    setComments(comments.map(c =>
      c.id === id ? { ...c, likes: c.likes + 1 } : c
    ));
  }
  function handleDislike(id) {
    setComments(comments.map(c =>
      c.id === id ? { ...c, dislikes: c.dislikes + 1 } : c
    ));
  }

  // ریپورت اسپم
  function handleReport(id) {
    setComments(comments.map(c =>
      c.id === id ? { ...c, reported: true } : c
    ));
    alert("نظر گزارش شد و برای مدیریت ارسال شد.");
  }

  // ویرایش/حذف پاسخ مدیریت
  function handleDeleteReply(id) {
    setComments(comments.map(c =>
      c.id === id ? { ...c, reply: null } : c
    ));
  }

  // میانگین امتیاز و تعداد نظرات
  const rates = comments.map(c => c.rate);
  const avgRate = rates.length ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : "-";

  return (
    <div className="product-comments-root">
      <h2 className="product-comments-title">
        نظرات کاربران درباره محصول
      </h2>
      <div className="product-comments-summary">
        <div>تعداد نظرات: <b>{comments.length}</b></div>
        <div>میانگین امتیاز: <b style={{color:"#f39c12"}}>{avgRate} / 5</b></div>
      </div>
      <form className="new-comment-form" onSubmit={handleAddComment}>
        <h3>ثبت نظر جدید</h3>
        <input
          type="text"
          value={newCommentUser}
          onChange={e => setNewCommentUser(e.target.value)}
          placeholder="نام شما"
          required
          className="new-comment-input"
        />
        <div className="rate-row">
          <label>امتیاز شما:</label>
          <div className="rate-stars">
            {[1,2,3,4,5].map(n => (
              <span
                key={n}
                className={n <= newCommentRate ? "star-filled" : "star-empty"}
                onClick={() => setNewCommentRate(n)}
                style={{cursor:"pointer", fontSize:"22px"}}
                title={`امتیاز ${n}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <textarea
          value={newCommentText}
          onChange={e => setNewCommentText(e.target.value)}
          rows={3}
          placeholder="نظر خود را بنویسید..."
          required
          className="new-comment-textarea"
        />
        <button type="submit" className="new-comment-btn">ثبت نظر</button>
      </form>
      <div className="filter-row">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو در نظرات..."
          className="search-input"
        />
        <select
          value={rateFilter}
          onChange={e => setRateFilter(Number(e.target.value))}
          className="rate-select"
        >
          <option value={0}>همه امتیازها</option>
          <option value={5}>فقط ۵ ستاره</option>
          <option value={4}>فقط ۴ ستاره</option>
          <option value={3}>فقط ۳ ستاره</option>
          <option value={2}>فقط ۲ ستاره</option>
          <option value={1}>فقط ۱ ستاره</option>
        </select>
      </div>
      {pagedComments.length === 0 ? (
        <div className="product-comments-empty">
          نظری مطابق جستجو یا فیلتر شما یافت نشد!
        </div>
      ) : (
        <div className="product-comments-list">
          {pagedComments.map((c) => (
            <div key={c.id} className={`product-comment-card${c.reported ? " product-comment-reported" : ""}`}>
              <div className="product-comment-info">
                <span className="product-comment-user">کاربر: <b>{c.user}</b></span>
                <span className="product-comment-date">{c.date}</span>
                <span className="product-comment-rate">{'★'.repeat(c.rate)}<span className="product-comment-rate-empty">{'★'.repeat(5-c.rate)}</span></span>
              </div>
              {editId === c.id ? (
                <div className="edit-form">
                  <div className="edit-rate-row">
                    <label>امتیاز:</label>
                    <div className="rate-stars">
                      {[1,2,3,4,5].map(n => (
                        <span
                          key={n}
                          className={n <= editRate ? "star-filled" : "star-empty"}
                          onClick={() => setEditRate(n)}
                          style={{cursor:"pointer", fontSize:"22px"}}
                          title={`امتیاز ${n}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="edit-textarea"
                  />
                  <div className="edit-btn-row">
                    <button onClick={handleEditSave} className="save-btn">ذخیره</button>
                    <button onClick={handleEditCancel} className="cancel-btn">انصراف</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="product-comment-text">{c.comment}</div>
                  {c.reply && replyEditId === c.id ? (
                    <div className="reply-edit-form">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={2}
                        className="edit-textarea"
                      />
                      <div className="edit-btn-row">
                        <button onClick={handleReplySave} className="save-btn">ذخیره پاسخ</button>
                        <button onClick={handleReplyCancel} className="cancel-btn">انصراف</button>
                      </div>
                    </div>
                  ) : c.reply ? (
                    <div className="product-comment-reply">
                      <b>پاسخ مدیریت:</b> {c.reply}
                      <button onClick={() => handleReply(c.id, c.reply)} className="reply-edit-btn">ویرایش پاسخ</button>
                      <button onClick={() => handleDeleteReply(c.id)} className="reply-delete-btn">حذف پاسخ</button>
                    </div>
                  ) : (
                    <button onClick={() => handleReply(c.id, "")} className="reply-add-btn">افزودن پاسخ مدیریت</button>
                  )}
                  <div className="action-row">
                    <button onClick={() => handleEdit(c.id, c.comment, c.rate)} className="edit-btn">ویرایش</button>
                    <button onClick={() => handleDelete(c.id)} className="delete-btn">حذف</button>
                    <button onClick={() => handleReport(c.id)} className="report-btn" disabled={c.reported}>
                      {c.reported ? "گزارش شد" : "گزارش اسپم"}
                    </button>
                  </div>
                  <div className="likes-row">
                    <button className="like-btn" onClick={() => handleLike(c.id)}>
                      👍 {c.likes}
                    </button>
                    <button className="dislike-btn" onClick={() => handleDislike(c.id)}>
                      👎 {c.dislikes}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Pagination */}
      {pageCount > 1 && (
        <div className="pagination-row">
          <button onClick={() => setCurrentPage(p=>Math.max(1, p-1))} disabled={currentPage===1}>قبلی</button>
          {[...Array(pageCount).keys()].map(i => (
            <button
              key={i}
              onClick={() => setCurrentPage(i+1)}
              className={currentPage===i+1 ? "active-page" : ""}
            >
              {i+1}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p=>Math.min(pageCount, p+1))} disabled={currentPage===pageCount}>بعدی</button>
        </div>
      )}
      <style>{`
        .product-comments-root {
          max-width: 700px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .product-comments-title {
          font-weight: bold;
          font-size: 22px;
          color: #3498db;
          margin-bottom: 20px;
          text-align: center;
        }
        .product-comments-summary {
          display: flex;
          gap: 28px;
          font-size: 17px;
          margin-bottom: 17px;
          justify-content: center;
        }
        .new-comment-form {
          background: #f8fafc;
          border-radius: 13px;
          padding: 15px 13px;
          margin-bottom: 21px;
          box-shadow: 0 2px 8px #eee;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .new-comment-input { width: 40%; min-width: 110px; border-radius: 7px; border: 1px solid #eee; padding: 8px 10px; font-size: 15px; font-family: inherit;}
        .rate-row label { font-weight: bold; color: #27ae60; margin-bottom: 7px;}
        .rate-stars { display: inline-flex; gap: 4px; margin-right: 8px;}
        .star-filled { color: #f39c12; text-shadow: 0 1px 2px #eee;}
        .star-empty { color: #ddd;}
        .new-comment-textarea { width: 100%; border-radius: 7px; border: 1px solid #eee; padding: 8px 10px; font-size: 15px; font-family: inherit;}
        .new-comment-btn { background: linear-gradient(90deg,#27ae60 70%,#43e97b 100%); color: #fff; border: none; border-radius: 10px; padding: 11px 0; font-size: 1rem; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px #eee; transition: background .2s;}
        .filter-row { display: flex; gap: 8px; margin-bottom: 18px; align-items: center;}
        .search-input { flex: 1; border: 1px solid #eee; border-radius: 7px; padding: 8px 10px; font-size: 15px; font-family: inherit;}
        .rate-select { border-radius: 7px; border: 1px solid #eee; padding: 7px 10px; font-size: 15px; font-family: inherit;}
        .product-comments-empty { text-align: center; color: #888; font-size: 18px; padding: 40px 0;}
        .product-comments-list { display: flex; flex-direction: column; gap: 18px;}
        .product-comment-card { background: #f8fafc; border-radius: 13px; box-shadow: 0 2px 9px #eee; padding: 15px 13px; position: relative;}
        .product-comment-card.product-comment-reported { border: 2px solid #e74c3c; box-shadow: 0 4px 15px #ffd6d6;}
        .product-comment-info { display: flex; gap: 18px; align-items: center; margin-bottom: 7px; font-size: 15px;}
        .product-comment-user { color: #3498db;}
        .product-comment-date { color: #444;}
        .product-comment-rate { color: #f39c12; font-weight: bold; font-size: 19px;}
        .product-comment-rate-empty { color: #eee;}
        .product-comment-text { font-size: 16px; margin-top: 4px;}
        .product-comment-reply { background: #fff9e8; border-radius: 7px; padding: 9px 10px; font-size: 15px; color: #e67e22; margin-top: 8px; position: relative;}
        .product-comment-reply b { margin-left: 5px;}
        .reply-edit-btn, .reply-delete-btn, .reply-add-btn { background: #ffe3b3; border:none; border-radius:6px; font-size:13px; padding:4px 10px; margin-right:7px; cursor:pointer; font-family:inherit;}
        .reply-edit-btn { background: #ffe3b3;}
        .reply-delete-btn { background: #ffd6d6;}
        .reply-add-btn { background: #c8f7c5; margin-top:7px;}
        .action-row { display: flex; gap: 8px; margin-top: 8px;}
        .edit-btn, .delete-btn, .save-btn, .cancel-btn, .report-btn { font-size: 14px; border: none; border-radius: 6px; padding: 7px 15px; cursor: pointer; font-family: inherit; font-weight: bold;}
        .edit-btn { background: #3498db; color: #fff;}
        .delete-btn { background: #e74c3c; color: #fff;}
        .save-btn { background: #27ae60; color: #fff;}
        .cancel-btn { background: #bdc3c7; color: #555;}
        .report-btn { background: #fff4e2; color: #e67e22;}
        .edit-form, .reply-edit-form { margin-top: 7px; background: #f0f8ff; border-radius: 7px; padding: 8px 10px;}
        .edit-rate-row { margin-bottom: 8px;}
        .edit-textarea { width: 100%; border-radius: 7px; border: 1px solid #eee; padding: 7px 9px; font-size: 15px; margin-bottom: 8px; font-family: inherit;}
        .edit-btn-row { display: flex; gap: 7px; margin-top: 5px;}
        .likes-row { display: flex; gap: 12px; margin-top: 10px;}
        .like-btn, .dislike-btn { background: #eee; border: none; border-radius: 7px; padding: 7px 17px; font-size: 15px; cursor: pointer; font-family: inherit; font-weight: bold; transition: background .2s;}
        .like-btn:hover { background: #d1f0d1;}
        .dislike-btn:hover { background: #ffe3e3;}
        .pagination-row { display: flex; gap: 6px; margin: 28px 0 8px 0; justify-content: center;}
        .pagination-row button { border-radius: 7px; border: 1px solid #eee; font-size: 15px; font-family: inherit; background: #eee; padding: 7px 14px; cursor: pointer;}
        .pagination-row button.active-page { background: #3498db; color: #fff;}
        @media (max-width: 700px) {
          .product-comments-root { padding: 11px 2px;}
          .product-comment-card { padding: 9px 5px;}
        }
      `}</style>
    </div>
  );
}
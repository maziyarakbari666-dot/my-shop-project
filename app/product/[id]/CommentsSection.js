'use client';

import { useState } from "react";

export default function CommentsSection({ productId }) {
  const [comments, setComments] = useState([
    { id: 1, user: "رضا", text: "خیلی خوب بود، خوشمزه!", date: "1402/06/12" },
    { id: 2, user: "فاطمه", text: "قیمتش مناسب نیست...", date: "1402/06/13" },
  ]);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim().length < 3) return;
    setComments([
      ...comments,
      {
        id: Math.random(),
        user: "کاربر مهمان",
        text: newComment,
        date: new Date().toLocaleDateString("fa-IR"),
      },
    ]);
    setNewComment("");
  };

  return (
    <div className="comments-section-root">
      <h3 className="comments-title">نظرات کاربران برای این محصول</h3>
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">هنوز نظری ثبت نشده است.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <span className="comment-user">{c.user}:</span>
              <span className="comment-text">{c.text}</span>
              <span className="comment-date">{c.date}</span>
            </div>
          ))
        )}
      </div>
      <div className="comments-add">
        <textarea
          className="comments-input"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="نظر خود را بنویسید..."
          rows={2}
        />
        <button
          className="comments-btn"
          onClick={handleAddComment}
          disabled={newComment.trim().length < 3}
        >
          ثبت نظر
        </button>
      </div>
      <style>{`
        .comments-section-root {margin:40px auto 0 auto; max-width:600px; padding:20px 18px; background:#f7f9fa; border-radius:14px; box-shadow:0 2px 13px #eee;}
        .comments-title {font-size:18px; color:#3498db; font-weight:bold; margin-bottom:12px;}
        .comments-list {margin-bottom:18px;}
        .comment-item {background:#fff; padding:8px 11px; border-radius:8px; margin-bottom:7px; box-shadow:0 1px 4px #eee; display:flex; justify-content:space-between; align-items:center;}
        .comment-user {color:#27ae60; font-weight:bold;}
        .comment-text {margin:0 9px;}
        .comment-date {color:#888; font-size:13px;}
        .comments-empty {text-align:center; color:#888; margin:10px 0;}
        .comments-add {display:flex; gap:9px;}
        .comments-input {width:100%; border-radius:8px; border:1px solid #eee; padding:7px 10px; font-size:15px;}
        .comments-btn {background:#3498db; color:#fff; border:none; border-radius:8px; padding:7px 19px; font-weight:bold; cursor:pointer; transition:background .2s;}
        .comments-btn:disabled {opacity:0.5; cursor:not-allowed;}
      `}</style>
    </div>
  );
}
'use client';

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function ContactPage() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [info, setInfo] = useState({ phone: '', address: '', instagram: '', email: '' });

  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch(`${BASE_API}/api/settings`, { cache: 'no-store' });
        const d = await r.json();
        if (r.ok && d?.settings?.contact) setInfo(d.settings.contact);
      }catch(_){ }
    })();
  },[]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("لطفاً همه فیلدها را کامل کنید.");
      return;
    }
    toast.success("پیام شما با موفقیت ارسال شد!");
    setForm({ name: "", phone: "", message: "" });
  }

  return (
    <div className="contact-root">
      <h2 className="contact-title">تماس با ما</h2>
      <div className="contact-info">
        {info.phone && <div><b>📞 تلفن:</b> {info.phone}</div>}
        {info.address && <div><b>📍 آدرس:</b> {info.address}</div>}
        {info.instagram && <div><b>🌐 اینستاگرام:</b> <a href={/^https?:/i.test(info.instagram)? info.instagram : `https://instagram.com/${info.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">{info.instagram}</a></div>}
        {info.email && <div><b>✉️ ایمیل:</b> <a href={`mailto:${info.email}`}>{info.email}</a></div>}
      </div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="نام شما"
          className="contact-input"
        />
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="شماره موبایل"
          className="contact-input"
        />
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="متن پیام"
          className="contact-input"
        />
        <button type="submit" className="contact-btn">ارسال پیام</button>
      </form>
      <style>{`
        .contact-root {
          max-width: 500px;
          margin: 40px auto;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 2px 18px #eee;
          padding: 30px 16px;
          font-family: Vazirmatn,sans-serif;
        }
        .contact-title {
          font-size: 1.25rem;
          color: var(--accent);
          font-weight: bold;
          margin-bottom: 15px;
          text-align: center;
        }
        .contact-info {
          margin-bottom: 32px;
          font-size: 1.09rem;
          color: #444;
          line-height: 2.2;
        }
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .contact-input {
          padding: 9px 14px;
          border-radius: 9px;
          border: 1px solid #ddd;
          font-size: 1rem;
          background: #f8fafc;
          transition: border-color .2s;
        }
        .contact-input:focus {
          border-color: var(--accent);
          background: #fff4e6;
        }
        .contact-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 0;
          font-size: 1.09rem;
          font-weight: bold;
          cursor: pointer;
        }
        .contact-btn:hover {
          background: #ff8c1a;
        }
        @media (max-width: 600px) {
          .contact-root { padding: 12px 2px;}
          .contact-title { font-size: 1rem;}
        }
      `}</style>
    </div>
  );
}
'use client';

import React, { useState } from "react";
import Link from "next/link";

// دمو اطلاعات کاربر
const mockUser = {
  name: "رضا رضایی",
  phone: "09121112233",
  email: "reza@test.com",
  addresses: [
    "تهران، خیابان ولیعصر، کوچه مهر، ساختمان 21، واحد 4",
    "تهران، شهرک غرب، خیابان ایران‌زمین، ساختمان 11، واحد 2",
  ],
};

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);

  function handleSaveProfile(e) {
    e.preventDefault();
    setUser({ ...user, name: editName, phone: editPhone });
    setShowEdit(false);
  }

  return (
    <div className="profile-root">
      <h2 className="profile-title">پروفایل کاربری</h2>
      <div className="profile-info">
        {showEdit ? (
          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <label>نام:</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} />
            <label>شماره موبایل:</label>
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            <button type="submit" className="profile-save-btn">ذخیره</button>
            <button type="button" className="profile-cancel-btn" onClick={() => setShowEdit(false)}>انصراف</button>
          </form>
        ) : (
          <>
            <div><b>نام:</b> {user.name}</div>
            <div><b>شماره موبایل:</b> {user.phone}</div>
            <div><b>ایمیل:</b> {user.email}</div>
            <button className="profile-edit-btn" onClick={() => setShowEdit(true)}>ویرایش مشخصات</button>
          </>
        )}
      </div>
      <div className="profile-addresses">
        <div className="profile-address-title">آدرس‌های من:</div>
        {user.addresses.length === 0 ? (
          <div className="profile-address-empty">هنوز آدرسی ثبت نکرده‌اید.</div>
        ) : (
          <ul>
            {user.addresses.map((addr, i) => (
              <li key={i}>{addr}</li>
            ))}
          </ul>
        )}
        <Link href="/address/add">
          <button className="profile-address-add-btn">افزودن آدرس جدید</button>
        </Link>
      </div>
      <div className="profile-actions">
        <Link href="/orders"><button className="profile-orders-btn">سفارش‌های من</button></Link>
        <button className="profile-logout-btn">خروج از حساب</button>
      </div>
      <style>{`
        .profile-root {
          max-width: 500px;
          margin: 44px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 29px 16px;
          font-family: Vazirmatn,sans-serif;
        }
        .profile-title {
          font-size: 1.2rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .profile-info {
          margin-bottom: 25px;
          background: #f8fafc;
          border-radius: 13px;
          padding: 13px 14px;
          font-size: 1rem;
        }
        .profile-edit-btn, .profile-save-btn, .profile-cancel-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 24px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 12px;
          margin-right: 8px;
        }
        .profile-cancel-btn {
          background: #e67e22;
        }
        .profile-edit-form label {
          font-weight: bold;
          color: #27ae60;
          margin-top: 7px;
        }
        .profile-edit-form input {
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid #eee;
          margin-bottom: 7px;
          font-size: 16px;
        }
        .profile-addresses {
          margin-bottom: 23px;
        }
        .profile-address-title {
          font-weight: bold;
          color: #213e32;
          margin-bottom: 9px;
        }
        .profile-address-empty {
          color: #888;
          font-size: 1rem;
          margin-bottom: 9px;
        }
        .profile-address-add-btn {
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 24px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
        }
        .profile-actions {
          text-align: center;
          margin-top: 24px;
          display: flex;
          gap: 18px;
          justify-content: center;
        }
        .profile-orders-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 11px 28px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        .profile-logout-btn {
          background: #c0392b;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 11px 28px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        @media (max-width: 600px) {
          .profile-root { padding: 7px 2px;}
        }
      `}</style>
    </div>
  );
}
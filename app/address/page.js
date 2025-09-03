'use client';

import React, { useState } from "react";
import Link from "next/link";

// دمو: لیست آدرس‌ها
const mockAddresses = [
  {
    id: 1,
    address: "تهران، خیابان ولیعصر، کوچه مهر، ساختمان 21، واحد 4",
    region: "منطقه 1",
    plaque: "21",
    unit: "4",
    isDefault: true,
  },
  {
    id: 2,
    address: "تهران، شهرک غرب، خیابان ایران‌زمین، ساختمان 11، واحد 2",
    region: "منطقه 2",
    plaque: "11",
    unit: "2",
    isDefault: false,
  },
];

export default function AddressListPage() {
  const [addresses, setAddresses] = useState(mockAddresses);

  function handleDelete(id) {
    setAddresses(addresses.filter(a => a.id !== id));
  }

  function handleSetDefault(id) {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  }

  return (
    <div className="address-root">
      <h2 className="address-title">مدیریت آدرس‌ها</h2>
      {addresses.length === 0 ? (
        <div className="address-empty">
          هنوز آدرسی ثبت نکرده‌اید!
          <Link href="/address/add">
            <button className="address-add-btn">افزودن آدرس جدید</button>
          </Link>
        </div>
      ) : (
        <>
          <div className="address-list">
            {addresses.map(addr => (
              <div key={addr.id} className={`address-card${addr.isDefault ? " address-default" : ""}`}>
                <div className="address-row">
                  <b>{addr.address}</b>
                  <span className="address-region">{addr.region}</span>
                </div>
                <div className="address-row">
                  <span>پلاک: {addr.plaque} | واحد: {addr.unit}</span>
                </div>
                <div className="address-actions">
                  {!addr.isDefault && (
                    <button className="address-default-btn" onClick={() => handleSetDefault(addr.id)}>
                      انتخاب به عنوان پیش‌فرض
                    </button>
                  )}
                  <Link href={`/address/edit/${addr.id}`}>
                    <button className="address-edit-btn">ویرایش</button>
                  </Link>
                  <button className="address-delete-btn" onClick={() => handleDelete(addr.id)}>
                    حذف
                  </button>
                </div>
                {addr.isDefault && <span className="address-default-label">آدرس پیش‌فرض</span>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/address/add">
              <button className="address-add-btn">افزودن آدرس جدید</button>
            </Link>
          </div>
        </>
      )}
      <style>{`
        .address-root {
          max-width: 650px;
          margin: 44px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 18px #eee;
          font-family: Vazirmatn,sans-serif;
          padding: 32px 20px;
        }
        .address-title {
          font-weight: bold;
          font-size: 22px;
          color: #27ae60;
          margin-bottom: 20px;
          text-align: center;
        }
        .address-empty {
          text-align: center;
          color: #888;
          font-size: 18px;
          padding: 40px 0;
        }
        .address-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .address-card {
          background: #f7f7f7;
          border-radius: 13px;
          box-shadow: 0 2px 10px #eee;
          padding: 15px 13px;
          position: relative;
        }
        .address-default {
          border: 2px solid #27ae60;
        }
        .address-row {
          font-size: 1rem;
          margin-bottom: 7px;
        }
        .address-region {
          color: #3498db;
          margin-right: 8px;
        }
        .address-actions {
          margin-top: 10px;
          display: flex;
          gap: 11px;
        }
        .address-default-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 18px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        .address-edit-btn {
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 18px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        .address-delete-btn {
          background: #c0392b;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 18px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        .address-add-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 13px 37px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        .address-default-label {
          position: absolute;
          top: 9px;
          left: 14px;
          background: #27ae60;
          color: #fff;
          font-size: 13px;
          padding: 3px 10px;
          border-radius: 7px;
          font-weight: bold;
        }
        @media (max-width: 700px) {
          .address-root { padding: 11px 2px; }
          .address-card { padding: 9px 5px;}
        }
      `}</style>
    </div>
  );
}
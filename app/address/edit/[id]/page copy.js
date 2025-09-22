'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// دمو: اطلاعات آدرس (در حالت واقعی باید از API یا سرور خوانده شود)
const mockAddress = {
  id: 1,
  address: "تهران، خیابان ولیعصر، کوچه مهر، ساختمان 21، واحد 4",
  region: "منطقه 1",
  plaque: "21",
  unit: "4",
};

export default function EditAddressPage() {
  const params = useParams();
  // در حالت واقعی: بر اساس params.addressId اطلاعات را fetch کن!
  const [address, setAddress] = useState(mockAddress.address);
  const [region, setRegion] = useState(mockAddress.region);
  const [plaque, setPlaque] = useState(mockAddress.plaque);
  const [unit, setUnit] = useState(mockAddress.unit);
  const [success, setSuccess] = useState(false);

  const REGIONS = ["منطقه 1", "منطقه 2", "منطقه 3", "منطقه 4", "منطقه 5"];

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(true);
    // در حالت واقعی، اینجا اطلاعات جدید آدرس را به API ارسال کن
  }

  return (
    <div className="address-root">
      <h2 className="address-title">ویرایش آدرس</h2>
      {!success ? (
        <form className="address-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>آدرس کامل:</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
              placeholder="خیابان، کوچه، ساختمان..."
            />
          </div>
          <div className="form-row">
            <label>منطقه:</label>
            <select value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-row-flex">
            <div>
              <label>پلاک:</label>
              <input
                type="text"
                value={plaque}
                onChange={e => setPlaque(e.target.value)}
                placeholder="مثلاً 12"
              />
            </div>
            <div>
              <label>واحد:</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="مثلاً 3"
              />
            </div>
          </div>
          <button type="submit" className="address-btn">ذخیره تغییرات</button>
        </form>
      ) : (
        <div className="address-success">
          ✅ آدرس با موفقیت ویرایش شد!
          <div style={{ marginTop: 22 }}>
            <Link href="/address">
              <button className="address-back-btn">بازگشت به لیست آدرس‌ها</button>
            </Link>
          </div>
        </div>
      )}
      <style>{`
        .address-root {
          max-width: 430px;
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
        .address-form {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }
        .form-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .form-row label {
          font-size: 15px;
          font-weight: bold;
          color: #444;
        }
        .form-row input,
        .form-row select {
          padding: 8px 10px;
          font-size: 16px;
          border-radius: 8px;
          border: 1px solid #eee;
          outline: none;
          font-family: inherit;
        }
        .form-row-flex {
          display: flex;
          gap: 18px;
        }
        .form-row-flex > div {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .address-btn {
          background: linear-gradient(90deg,#27ae60 70%,#43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 0;
          font-size: 1.09rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px #eee;
          transition: background .2s;
          margin-top: 13px;
        }
        .address-success {
          color: #27ae60;
          font-size: 21px;
          text-align: center;
          margin-top: 55px;
          font-family: Vazirmatn,sans-serif;
        }
        .address-back-btn {
          background: #27ae60;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 12px 38px;
          font-size: 17px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 12px #eee;
          transition: background .2s;
        }
        .address-back-btn:hover {
          background: #219150;
        }
        @media (max-width: 600px) {
          .address-root { padding: 11px 2px; }
          .address-title { font-size: 18px; }
          .address-btn { padding: 9px 0; font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
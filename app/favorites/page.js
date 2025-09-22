'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesPage() {
  const { favorites, removeFavorite, toggleFavorite } = useFavorites();

  return (
    <div className="fav-root">
      <h2 className="fav-title">محصولات مورد علاقه</h2>
      {favorites.length === 0 ? (
        <div className="fav-empty">
          هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.
          <div style={{ marginTop: 14 }}>
            <Link href="/">
              <button className="fav-browse-btn">مشاهده محصولات</button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="fav-list">
          {favorites.map(p => {
            const id = p._id || p.id;
            return (
              <div key={id} className="fav-item">
                <Link href={`/product/${id}`} className="fav-imgw" aria-label={`مشاهده ${p.name}`}>
                  <Image src={p.image} alt={p.name} width={80} height={80} className="fav-img" />
                </Link>
                <div className="fav-info">
                  <Link href={`/product/${id}`} className="fav-name">{p.name}</Link>
                  <div className="fav-price">{Number(p.price||0).toLocaleString()} تومان</div>
                </div>
                <div className="fav-actions">
                  <button className="fav-remove" onClick={() => removeFavorite(id)}>حذف</button>
                  <Link href={`/product/${id}`} className="fav-open">مشاهده</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .fav-root { max-width: 900px; margin: 40px auto; background:#fff; border-radius: 18px; box-shadow: 0 2px 18px #eee; padding: 22px 16px; font-family: Vazirmatn,sans-serif; }
        .fav-title { font-weight: 900; font-size: 1.6rem; color: var(--brand-purple-2,#663191); text-align:center; margin-bottom: 18px; }
        .fav-empty { text-align:center; color:#888; font-size:1rem; padding: 40px 0; }
        .fav-browse-btn { background: var(--brand-orange-2,#F26826); color:#fff; border:none; border-radius:9px; padding:10px 24px; font-weight:800; cursor:pointer; }
        .fav-list { display:flex; flex-direction:column; gap:12px; }
        .fav-item { display:flex; align-items:center; gap:12px; background:#fafafa; border:1px solid #eee; border-radius:12px; padding:10px; }
        .fav-imgw { display:flex; align-items:center; justify-content:center; }
        .fav-img { border-radius:10px; object-fit:cover; }
        .fav-info { flex:1; }
        .fav-name { display:block; font-weight:800; color: var(--brand-purple-2,#663191); text-decoration:none; margin-bottom:4px; }
        .fav-price { color: var(--brand-orange-2,#F26826); font-weight:800; }
        .fav-actions { display:flex; gap:8px; }
        .fav-remove { background:#fff5f5; color:#e74c3c; border:1px solid #f5c6cb; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:700; }
        .fav-open { background:#fff; color: var(--brand-purple-2,#663191); border:1px solid #ddd; border-radius:8px; padding:8px 14px; text-decoration:none; font-weight:700; }
        @media (max-width: 600px){ .fav-item { align-items:flex-start; } }
      `}</style>
    </div>
  );
}

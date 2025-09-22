'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '../context/FavoritesContext';

export default function ProductCard({ product, onAdd }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const productId = product._id || product.id;
  const fav = isFavorite(productId);

  return (
    <div className="pcard">
      <div className="imgw">
        {!imageLoaded && !imageError && (
          <div className="img-skeleton">
            <div className="skeleton-shimmer"></div>
          </div>
        )}
        <Link href={`/product/${productId}`} aria-label={`مشاهده ${product.name}`}>
          <Image 
            src={product.image} 
            alt={product.name} 
            width={175} 
            height={175} 
            className={`img ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy"
            quality={75}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 175px"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </Link>
        {imageError && (
          <div className="img-placeholder">
            <span>🖼️</span>
            <span>تصویر ناموجود</span>
          </div>
        )}
        <button
          type="button"
          className={`fav-btn ${fav ? 'active' : ''}`}
          aria-label={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
          title={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        >
          {fav ? '♥' : '♡'}
        </button>
        {(product.stock ?? 0) === 0 && <span className="badge">ناموجود</span>}
      </div>
      <div className="info">
        <Link href={`/product/${productId}`} className="name" aria-label={`مشاهده ${product.name}`}>
          <h3 className="name">{product.name}</h3>
        </Link>
        {product.description && <p className="desc">{product.description}</p>}
        <div className="bottom">
          {Number(product.discountPercent) > 0 ? (
            <>
              <span className="price new">{Math.max(0, Math.round((Number(product.price)||0) * (1 - Number(product.discountPercent)/100))).toLocaleString()} تومان</span>
              <span className="price old">{(Number(product.price)||0).toLocaleString()} تومان</span>
            </>
          ) : (
            <span className="price">{(Number(product.price)||0).toLocaleString()} تومان</span>
          )}
        </div>
        <button className="btn" disabled={(product.stock ?? 0) === 0} onClick={onAdd}>افزودن به سبد</button>
      </div>
      <style jsx>{`
        .pcard { background:#fff; border-radius:17px; box-shadow:0 2px 16px #eee; width:330px; display:flex; flex-direction:column; align-items:center; padding:19px 13px; position:relative; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .pcard:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .imgw { position:relative; width:100%; display:flex; justify-content:center; }
        .img { width:90%; max-width:175px; border-radius:18px; object-fit:cover; margin-bottom:14px; box-shadow:0 1px 10px #e1e1e1; background:#fafafa; transition: opacity 0.3s ease; opacity: 0; }
        .img.loaded { opacity: 1; }
        .fav-btn { position:absolute; left:16px; top:12px; background:#fff; border:1px solid #eee; color:#c0392b; border-radius:999px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .fav-btn.active { color:#e74c3c; border-color:#e74c3c; background:#fff5f5; }
        .img-skeleton { position: absolute; width:90%; max-width:175px; height:175px; border-radius:18px; background:#fafafa; overflow: hidden; margin-bottom:14px; }
        .skeleton-shimmer { width: 100%; height: 100%; background: linear-gradient(90deg, #f2f2f2 25%, #eaeaea 37%, #f2f2f2 63%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
        .img-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; width:90%; max-width:175px; height:175px; border-radius:18px; background:#f8f8f8; border: 2px dashed #ddd; margin-bottom:14px; color: #999; font-size: 12px; text-align: center; }
        .img-placeholder span:first-child { font-size: 24px; margin-bottom: 4px; }
        @keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
        .badge { position:absolute; right:16px; top:12px; background:#c0392b; color:#fff; padding:4px 13px; border-radius:11px; font-weight:700; z-index: 2; }
        .info { width:100%; }
        .name { font-size:1.13rem; color:var(--brand-purple-2,#663191); font-weight:800; margin:0 0 4px 0; text-align:center; }
        .desc { font-size:15px; color:#555; margin:0 0 10px 0; text-align:center; }
        .bottom { display:flex; justify-content:center; align-items:center; margin-bottom:10px; font-size:15px; gap:8px; }
        .price { color:var(--brand-orange-2,#F26826); font-weight:800; }
        .price.old { color:#aaa; text-decoration: line-through; font-weight:600; margin-right:8px; }
        .price.new { color:var(--brand-orange-2,#F26826); font-weight:900; }
        .btn { background: var(--brand-purple-2,#663191); color:#fff; border:none; border-radius:13px; padding:13px 0; width:100%; font-weight:800; font-size:16px; cursor:pointer; box-shadow:0 1px 6px #e2e2e2; margin-top:4px; transition: transform 0.1s ease; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); }
        .btn:disabled{ background:#ccc; cursor:not-allowed; }
      `}</style>
    </div>
  );
}

// end of file
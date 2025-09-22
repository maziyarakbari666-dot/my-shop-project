'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';

export default function Banner({ slides = [], title = 'بیگ‌بیر - سوپرمارکت آنلاین', subtitle = 'تازه‌ترین محصولات، ارسال سریع، پرداخت اعتباری' }) {
  const defaults = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1400&q=80',
  ];
  const effectiveSlides = (slides && slides.length ? slides : defaults);
  const multi = effectiveSlides.length > 1;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return (
      <div className="bb-banner">
        <div className="bb-skeleton">
          <div className="bb-skeleton-img"></div>
          <div className="bb-skeleton-text">
            <div className="bb-skeleton-title"></div>
            <div className="bb-skeleton-subtitle"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bb-banner">
      <div className={`bb-slides ${multi ? 'anim' : ''}`} style={{ width: `${100 * effectiveSlides.length}%` }}>
        {effectiveSlides.map((src, i) => (
          <div className="bb-slide" key={i}>
            <Image 
              src={src} 
              alt={`بنر ${i+1}`} 
              width={640} 
              height={360} 
              className="bb-img" 
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              quality={i === 0 ? 90 : 80}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="bb-text">
              <h1 className="bb-title">{title}</h1>
              <p className="bb-sub">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .bb-banner { position: relative; overflow: hidden; border-radius: 24px; box-shadow: 0 8px 38px #e2e6ea; margin: 30px 0 24px 0; background: linear-gradient(90deg, rgba(108,43,217,.08) 60%, rgba(255,122,24,.08) 100%); }
        .bb-slides { display: flex; }
        .bb-slides.anim { animation: bb-slide 16s infinite; }
        .bb-slide { width: 100%; display: flex; align-items: center; gap: 14px; padding: 6px 8px 14px 8px; }
        @keyframes bb-slide { 0% {transform: translateX(0%);} 30%{transform:translateX(0%);} 33%{transform:translateX(-100%);} 63%{transform:translateX(-100%);} 66%{transform:translateX(-200%);} 96%{transform:translateX(-200%);} 100%{transform:translateX(0%);} }
        .bb-img { border-radius: 24px; object-fit: cover; width: 100%; height: auto; max-width: 520px; box-shadow: 0 2px 18px #eee; }
        .bb-text { flex: 1; text-align: center; padding: 10px 8px; }
        .bb-title { color: var(--primary); font-weight: 800; font-size: 2rem; margin: 0 0 8px 0; letter-spacing: .5px; }
        .bb-sub { color: #444; font-size: 1.05rem; }
        
        /* Skeleton loading styles */
        .bb-skeleton { display: flex; align-items: center; gap: 14px; padding: 6px 8px 14px 8px; }
        .bb-skeleton-img { 
          border-radius: 24px; 
          width: 100%; 
          height: 200px; 
          max-width: 520px; 
          background: linear-gradient(90deg, #f2f2f2 25%, #eaeaea 37%, #f2f2f2 63%); 
          background-size: 400% 100%; 
          animation: skeleton-loading 1.4s ease infinite; 
        }
        .bb-skeleton-text { flex: 1; text-align: center; padding: 10px 8px; }
        .bb-skeleton-title { 
          height: 32px; 
          width: 70%; 
          margin: 0 auto 8px auto; 
          border-radius: 8px; 
          background: linear-gradient(90deg, #f2f2f2 25%, #eaeaea 37%, #f2f2f2 63%); 
          background-size: 400% 100%; 
          animation: skeleton-loading 1.4s ease infinite; 
        }
        .bb-skeleton-subtitle { 
          height: 20px; 
          width: 50%; 
          margin: 0 auto; 
          border-radius: 8px; 
          background: linear-gradient(90deg, #f2f2f2 25%, #eaeaea 37%, #f2f2f2 63%); 
          background-size: 400% 100%; 
          animation: skeleton-loading 1.4s ease infinite; 
        }
        @keyframes skeleton-loading { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
        
        @media (max-width: 900px){ .bb-title{font-size:1.3rem;} .bb-img{max-width:96vw;} }
      `}</style>
    </div>
  );
}



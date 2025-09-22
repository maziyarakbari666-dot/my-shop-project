'use client';

import React, { useEffect, useState } from 'react';

export default function AboutPage() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [contentHtml, setContentHtml] = useState('');

  useEffect(()=>{
    (async()=>{
      try {
        const r = await fetch(`${BASE_API}/api/settings`, { cache: 'no-store' });
        const d = await r.json();
        if (r.ok) setContentHtml(d?.settings?.about?.contentHtml || '');
      } catch(_) {}
    })();
  },[]);

  return (
    <div className="about-root">
      <h2 className="about-title">درباره ما</h2>
      <div className="about-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      <style>{`
        .about-root { max-width: 900px; margin: 40px auto; background:#fff; border-radius:22px; box-shadow:0 2px 18px #eee; padding: 32px 20px; font-family: Vazirmatn,sans-serif; }
        .about-title { font-size:1.35rem; color: #27ae60; font-weight:bold; margin-bottom: 21px; text-align:center; }
        .about-content { font-size:1.07rem; color:#444; line-height:2.2; }
      `}</style>
    </div>
  );
}
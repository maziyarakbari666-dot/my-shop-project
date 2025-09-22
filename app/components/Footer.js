'use client';

import React, { useEffect, useState } from 'react';

export default function Footer() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [footer, setFooter] = useState({ textHtml: '', links: [] });

  useEffect(() => {
    (async()=>{
      try {
        const r = await fetch(`${BASE_API}/api/settings`, { cache: 'no-store' });
        const d = await r.json();
        if (r.ok && d?.settings?.footer) setFooter(d.settings.footer);
      } catch(_) {}
    })();
  }, [BASE_API]);

  return (
    <footer className="site-footer" aria-label="پاورقی سایت">
      <div className="footer-inner">
        <div className="footer-text" dangerouslySetInnerHTML={{ __html: footer?.textHtml || '' }} />
        {Array.isArray(footer?.links) && footer.links.length > 0 && (
          <nav className="footer-links" aria-label="لینک‌های مفید">
            {footer.links.map((l, i) => (
              <a key={i} href={l.href||'#'} className="footer-link" target={/^https?:/i.test(l.href||'')? '_blank':'_self'} rel="noopener noreferrer">
                {l.label||l.href}
              </a>
            ))}
          </nav>
        )}
      </div>
      <style>{`
        .site-footer { margin-top: 28px; background:#0f172a; color:#e2e8f0; }
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 22px 14px; display:flex; align-items:center; justify-content:space-between; gap: 12px; flex-wrap: wrap; }
        .footer-text :is(p,div,span){ margin: 0; }
        .footer-links { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .footer-link { color:#cbd5e1; text-decoration:none; background:#111827; border:1px solid #1f2937; padding:6px 10px; border-radius:8px; font-weight:700; }
        .footer-link:hover { color:#fff; background:#0b1220; }
        @media (max-width: 600px){ .footer-inner{ justify-content:center; text-align:center; } }
      `}</style>
    </footer>
  );
}



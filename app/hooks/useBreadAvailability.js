'use client';

import { useEffect, useState } from 'react';

const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useBreadAvailability(dateISO, productId) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dateISO) return;
    const url = new URL(BASE_API + '/api/bread/availability');
    const d = new Date(dateISO);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    url.searchParams.set('date', `${y}-${m}-${day}`);
    if (productId) url.searchParams.set('productId', productId);
    setLoading(true); setError('');
    fetch(url.toString(), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : [])
      .then(list => setSlots(list))
      .catch(e => setError(e.message || 'خطا در دریافت ظرفیت'))
      .finally(() => setLoading(false));
  }, [dateISO, productId]);

  return { slots, loading, error };
}






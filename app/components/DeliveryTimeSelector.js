'use client';

import React from 'react';
import { useBreadAvailability } from '../hooks/useBreadAvailability';

export default function DeliveryTimeSelector({ dateISO, value, onChange, productId }) {
  const { slots, loading } = useBreadAvailability(dateISO, productId);

  if (!dateISO) return null;

  const allUnavailable = !loading && (slots.length === 0 || slots.every(s => !s.isAvailable));

  return (
    <div>
      {loading && <div className="hint-muted">در حال دریافت ظرفیت...</div>}
      {!loading && allUnavailable && (
        <div className="hint-muted">🚫 نان در حال حاضر موجود نیست. زمان بعدی تأمین: ۱۲ ظهر</div>
      )}
      {!loading && !allUnavailable && (
        <div className="chips-grid time-chips">
          {slots.map((s, idx) => {
            const from = new Date(s.from);
            const to = new Date(s.to);
            const label = `${from.getHours()} تا ${to.getHours()}`;
            const disabled = !s.isAvailable;
            return (
              <button
                key={idx}
                type="button"
                className={`chip ${value===label? 'active':''}`}
                onClick={() => onChange?.(label)}
                disabled={disabled}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}



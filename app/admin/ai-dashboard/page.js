'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function AIDashboardPage() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('Show me all pending orders from this week');
  const [aiResult, setAiResult] = useState(null);
  const [err, setErr] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(() => (typeof window !== 'undefined' ? ((localStorage.getItem('admin_stream_enabled') ?? 'true') !== 'false') : true));
  const [ordersToday, setOrdersToday] = useState(0);
  const [pendingToday, setPendingToday] = useState(0);
  const [hasAnomaly, setHasAnomaly] = useState(false);
  const wsRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
        const headers = { Authorization: `Bearer ${token}` };
        const s = await fetch(`${BASE_API}/api/admin/analytics`, { headers, cache: 'no-store' });
        const d = await s.json();
        const dd = await fetch(`${BASE_API}/api/admin/analytics/daily`, { headers, cache: 'no-store' });
        const dj = await dd.json();
        setSummary(d);
        setDaily(dj?.rows || []);
        const inz = await fetch(`${BASE_API}/api/admin/insights`, { headers, cache: 'no-store' });
        const inzj = await inz.json();
        setInsights(inzj);
      } catch (e) {
        setErr('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    const labels = daily.map(r => r.date);
    const revenue = daily.map(r => r.revenue);
    const count = daily.map(r => r.count);
    return {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, borderColor: '#3b82f6' },
        { label: 'Orders', data: count, borderColor: '#10b981' },
      ]
    };
  }, [daily]);

  async function runAssistant() {
    try {
      setErr(null);
      setAiResult(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/admin/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Request failed');
      setAiResult(j);
      if (j?.confirmationRequired) {
        setPendingIntent(j?.intent || null);
        setConfirmOpen(true);
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  async function confirmExecution() {
    if (!pendingIntent) { setConfirmOpen(false); return; }
    try {
      setExecuting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const res = await fetch(`${BASE_API}/api/admin/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, context: { actionType: 'confirmed' } })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Request failed');
      setAiResult(j);
      setConfirmOpen(false);
      setPendingIntent(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setExecuting(false);
    }
  }

  function renderTable() {
    if (!aiResult) return null;
    const data = aiResult.orders || aiResult.products || aiResult.trending;
    if (!Array.isArray(data) || data.length === 0) return null;
    const cols = Object.keys(data[0]).slice(0, 6);
    return (
      <div className="overflow-auto">
        <table className="w-full text-xs border">
          <thead>
            <tr>
              {cols.map(c => (<th key={c} className="text-left border px-2 py-1">{c}</th>))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 50).map((row, idx) => (
              <tr key={idx}>
                {cols.map(c => (<td key={c} className="border px-2 py-1">{String(row[c])}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Live metrics subscribe (WS with SSE fallback)
  useEffect(() => {
    if (!streamEnabled) {
      try { wsRef.current?.close(); } catch(_) {}
      try { esRef.current?.close(); } catch(_) {}
      wsRef.current = null; esRef.current = null;
      return;
    }
    try {
      const wsProto = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss' : 'ws';
      const wsUrl = `${wsProto}://${(typeof window !== 'undefined' ? window.location.host : 'localhost:3000').replace(/:\d+$/, ':5000')}/ws/admin/metrics`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data || '{}');
          if (msg?.type === 'metrics' && msg?.data) {
            const data = msg.data;
            if (typeof data.ordersToday === 'number') setOrdersToday(data.ordersToday);
            if (typeof data.pendingToday === 'number') setPendingToday(data.pendingToday);
            if (typeof data.hasAnomaly === 'boolean') setHasAnomaly(data.hasAnomaly);
          }
        } catch(_) {}
      };
      ws.onerror = () => { try { ws.close(); } catch(_) {} };
      ws.onclose = () => {
        try {
          const es = new EventSource(`${BASE_API}/api/admin/stream/metrics`, { withCredentials: false });
          esRef.current = es;
          es.addEventListener('metrics', (ev) => {
            try {
              const data = JSON.parse(ev.data || '{}');
              if (typeof data.ordersToday === 'number') setOrdersToday(data.ordersToday);
              if (typeof data.pendingToday === 'number') setPendingToday(data.pendingToday);
              if (typeof data.hasAnomaly === 'boolean') setHasAnomaly(data.hasAnomaly);
            } catch(_) {}
          });
          es.onerror = () => { es.close(); };
        } catch(_) {}
      };
    } catch(_) {}
    return () => {
      try { wsRef.current?.close(); } catch(_) {}
      try { esRef.current?.close(); } catch(_) {}
      wsRef.current = null; esRef.current = null;
    };
  }, [streamEnabled]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">داشبورد هوشمند</h1>

      {loading ? (
        <div>Loading...</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="text-gray-500 text-sm">Total Revenue</div>
            <div className="text-2xl font-bold">{summary?.totalRevenue ?? 0}</div>
            <div className="text-xs text-gray-400">Avg Order: {summary?.avgOrder ?? 0}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="text-gray-500 text-sm">Total Orders</div>
            <div className="text-2xl font-bold">{summary?.count ?? 0}</div>
            <div className="text-xs text-gray-400">BNPL %: {summary?.bnplRatio ?? 0}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="text-gray-500 text-sm">By Status</div>
            <div className="text-sm">{Object.entries(summary?.byStatus || {}).map(([k,v]) => (
              <span key={k} className="inline-block mr-2">{k}: {v}</span>
            ))}</div>
          </div>
        </div>
      )}

      {/* Live mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-gray-500 text-sm">سفارش‌های امروز</div>
          <div className="text-2xl font-bold">{ordersToday}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-gray-500 text-sm">در انتظار (امروز)</div>
          <div className="text-2xl font-bold">{pendingToday}</div>
        </div>
        <div className={`rounded-xl p-4 shadow ${hasAnomaly ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
          <div className={`text-sm ${hasAnomaly ? 'text-red-700' : 'text-gray-500'}`}>وضعیت ناهنجاری</div>
          <div className={`text-2xl font-bold ${hasAnomaly ? 'text-red-700' : ''}`}>{hasAnomaly ? 'هشدار' : 'عادی'}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <div className="text-gray-700 font-semibold mb-2">Trend</div>
        <div className="w-full overflow-x-auto">
          <div className="text-sm text-gray-500">روزانه (revenue / orders)</div>
          {/* In case Chart isn't available in env, show fallback table */}
          <table className="w-full text-sm mt-2">
            <thead><tr><th className="text-left">Date</th><th className="text-left">Revenue</th><th className="text-left">Orders</th></tr></thead>
            <tbody>
              {daily.slice(-14).map(r => (
                <tr key={r.date}><td>{r.date}</td><td>{r.revenue}</td><td>{r.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {insights && (
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="font-semibold mb-2">بینش‌های هوش مصنوعی</div>
          {insights?.aiSummary && (
            <div className="text-sm text-gray-700">{insights.aiSummary}</div>
          )}
          <div className="text-xs text-gray-500 mt-2">Forecast: {insights?.forecast?.payload?.nextRevenue ?? '-'}</div>
          {insights?.anomaly?.payload?.message && (
            <div className="text-xs text-red-600 mt-1">{insights.anomaly.payload.message}</div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-2">
        <div className="font-semibold">Natural language query</div>
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask something about your store..." />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={runAssistant}>Run</button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <input id="streamToggle" type="checkbox" checked={streamEnabled} onChange={(e)=>{ setStreamEnabled(e.target.checked); if (typeof window !== 'undefined') localStorage.setItem('admin_stream_enabled', e.target.checked ? 'true' : 'false'); }} />
          <label htmlFor="streamToggle">بروزرسانی زنده (WS/SSE)</label>
        </div>
        {aiResult && (
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(aiResult, null, 2)}</pre>
        )}
        {renderTable()}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <div className="font-semibold mb-2">تایید عملیات</div>
            <div className="text-sm text-gray-700">این اقدام نیاز به تایید دارد. آیا مطمئن هستید؟</div>
            <div className="mt-3 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
              <pre>{JSON.stringify(pendingIntent, null, 2)}</pre>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-2 rounded border" onClick={()=>{ setConfirmOpen(false); setPendingIntent(null); }}>لغو</button>
              <button className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" onClick={confirmExecution} disabled={executing}>{executing ? 'در حال اجرا...' : 'تایید'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



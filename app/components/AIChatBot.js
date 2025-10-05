'use client';

import React, { useState } from 'react';

export default function AIChatBot() {
  const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [text, setText] = useState('Hi, I need help with my order');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  async function send() {
    if (!text.trim()) return;
    const message = text.trim();
    setText('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_API}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const j = await res.json();
      const reply = j?.message || '...';
      setHistory(h => [...h, { role: 'user', content: message }, { role: 'assistant', content: reply }]);
    } catch (e) {
      setHistory(h => [...h, { role: 'system', content: 'خطا در ارتباط با چت‌بات' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow">
      <div className="text-lg font-bold mb-2">پشتیبانی هوشمند</div>
      <div className="border rounded p-2 h-64 overflow-auto bg-gray-50 mb-2 text-sm">
        {history.length === 0 && <div className="text-gray-400">شروع گفتگو...</div>}
        {history.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block my-1 px-2 py-1 rounded bg-gray-200">{m.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" value={text} onChange={e=>setText(e.target.value)} placeholder="پیام خود را بنویسید..." />
        <button onClick={send} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">ارسال</button>
      </div>
    </div>
  );
}





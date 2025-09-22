'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const FavoritesContext = createContext();

export function useFavorites() {
  return useContext(FavoritesContext);
}

function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // load from storage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem('favorites');
      if (raw) setFavorites(JSON.parse(raw));
    } catch (_) {}
  }, []);

  // sync with server if logged in
  useEffect(() => {
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const token = window.localStorage.getItem('auth_token');
        if (!token) return;
        // get server favorites
        const res = await fetch(`${apiBase}/api/users/favorites`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const serverFavs = Array.isArray(data?.favorites) ? data.favorites : [];
        // union by id
        const byId = new Map();
        [...favorites, ...serverFavs].forEach(p => {
          const id = p._id || p.id;
          if (id) byId.set(id, { ...p, _id: id });
        });
        const merged = Array.from(byId.values());
        setFavorites(merged);
        // push local-only to server
        const serverIds = new Set(serverFavs.map(p => p._id || p.id));
        const toPush = merged.filter(p => !serverIds.has(p._id || p.id));
        await Promise.all(
          toPush.map(p => fetch(`${apiBase}/api/users/favorites/add`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: p._id || p.id })
          }).catch(() => {}))
        );
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // persist
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (_) {}
  }, [favorites]);

  const isFavorite = useCallback((productId) => {
    return favorites.some(p => (p._id || p.id) === productId);
  }, [favorites]);

  const addFavorite = useCallback(async (product) => {
    setFavorites(prev => {
      const id = product._id || product.id;
      if (prev.some(p => (p._id || p.id) === id)) return prev;
      return [...prev, product];
    });
    try {
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('auth_token');
        if (token) {
          await fetch(`${apiBase}/api/users/favorites/add`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: product._id || product.id })
          });
        }
      }
    } catch (_) {}
  }, [apiBase]);

  const removeFavorite = useCallback(async (productId) => {
    setFavorites(prev => prev.filter(p => (p._id || p.id) !== productId));
    try {
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('auth_token');
        if (token) {
          await fetch(`${apiBase}/api/users/favorites/remove`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId })
          });
        }
      }
    } catch (_) {}
  }, [apiBase]);

  const toggleFavorite = useCallback((product) => {
    const id = product._id || product.id;
    setFavorites(prev => {
      const exists = prev.some(p => (p._id || p.id) === id);
      if (exists) {
        // fire and forget server update
        (async () => { try { await removeFavorite(id); } catch(_){} })();
        return prev.filter(p => (p._id || p.id) !== id);
      } else {
        (async () => { try { await addFavorite(product); } catch(_){} })();
        return [...prev, product];
      }
    });
  }, [addFavorite, removeFavorite]);

  const value = useMemo(() => ({ favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite }), [favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export default FavoritesProvider;

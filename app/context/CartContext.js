'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("cart");
      if (stored) setCart(JSON.parse(stored));
      // fetch server cart if logged in
      const token = window.localStorage.getItem('auth_token');
      if (token) {
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/cart', { headers: { Authorization: `Bearer ${token}` }, credentials:'include', cache: 'no-store' })
          .then(r=>r.json()).then(d=>{
            if (d?.cart?.items) {
              const mapped = d.cart.items.map(i => ({ id: i.product?._id || i.product, name: i.product?.name || '', price: i.price, quantity: i.quantity, images: [], category: i.product?.category?.name }));
              setCart(mapped);
            }
          }).catch(()=>{});
      }
    } catch (_) {
      // ignore broken storage
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem("cart", JSON.stringify(cart));
    } catch (_) {
      // ignore quota/availability issues
    }
  }, [cart]);

  const addToCart = useCallback(async (product) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        const next = prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
        setLastAdded({ id: product.id, ts: Date.now(), qty: (found.quantity||0)+1 });
        return next;
      } else {
        const next = [...prev, { ...product, quantity: 1 }];
        setLastAdded({ id: product.id, ts: Date.now(), qty: 1 });
        return next;
      }
    });
    
    // Optimized server sync - no await for better UX
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token');
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        fetch(`${apiUrl}/api/csrf`, { credentials: 'include' })
          .then(r => r.json())
          .then(j => j?.csrfToken)
          .then(csrfToken => {
            fetch(`${apiUrl}/api/cart/add`, { 
              method: 'POST', 
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}`, 
                'x-csrf-token': csrfToken || '' 
              }, 
              credentials: 'include', 
              body: JSON.stringify({ productId: product.id, quantity: 1 }) 
            });
          })
          .catch(() => {}); // Silent fail for better UX
      }
    }
  }, []);

  const removeFromCart = useCallback(async (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
    
    // Optimized server sync
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token');
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        fetch(`${apiUrl}/api/csrf`, { credentials: 'include' })
          .then(r => r.json())
          .then(j => j?.csrfToken)
          .then(csrfToken => {
            fetch(`${apiUrl}/api/cart/remove`, { 
              method: 'POST', 
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}`, 
                'x-csrf-token': csrfToken || '' 
              }, 
              credentials: 'include', 
              body: JSON.stringify({ productId: id }) 
            });
          })
          .catch(() => {});
      }
    }
  }, []);

  const updateQuantity = useCallback(async (id, quantity) => {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: nextQuantity } : p))
    );
    
    // Optimized server sync
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token');
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        fetch(`${apiUrl}/api/csrf`, { credentials: 'include' })
          .then(r => r.json())
          .then(j => j?.csrfToken)
          .then(csrfToken => {
            fetch(`${apiUrl}/api/cart/update`, { 
              method: 'POST', 
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}`, 
                'x-csrf-token': csrfToken || '' 
              }, 
              credentials: 'include', 
              body: JSON.stringify({ productId: id, quantity: nextQuantity }) 
            });
          })
          .catch(() => {});
      }
    }
  }, []);

  const clearCart = useCallback(async () => {
    // پاک‌سازی استیت کلاینت
    setCart([]);
    
    if (typeof window !== 'undefined') {
      // پاک‌کردن کش لوکال
      window.localStorage.removeItem('cart');
      const token = window.localStorage.getItem('auth_token');
      
      // اگر کاربر لاگین است، سمت سرور هم پاک کنیم
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        fetch(`${apiUrl}/api/csrf`, { credentials: 'include' })
          .then(r => r.json())
          .then(j => j?.csrfToken)
          .then(csrfToken => {
            fetch(`${apiUrl}/api/cart/clear`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}`, 
                'x-csrf-token': csrfToken || '' 
              },
              credentials: 'include'
            });
          })
          .catch(() => {});
      }
    }
  }, []);

  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    lastAdded
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, lastAdded]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
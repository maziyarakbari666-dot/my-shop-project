'use client';

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Banner from "./components/Banner";
import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import LazyWrapper from "./components/LazyWrapper";
import { useCart } from "./context/CartContext";
import { usePaginatedApi } from "./hooks/useApi";
import styles from "./styles/HomePage.module.css";

// عکس‌های محصولات از Unsplash (رایگان و بی‌دردسر)
const categories = [
  {
    id: "bread",
    title: "نان",
    products: [
      {
        id: "1",
        name: "نان تست تازه",
        desc: "نان تست سنتی با کیفیت عالی و عطر دلپذیر.",
        price: 20000,
        stock: 15,
        image: "https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "2",
        name: "نان جو سبوس‌دار",
        desc: "نان جو سبوس‌دار، مناسب رژیم و سلامت.",
        price: 25000,
        stock: 12,
        image: "https://images.unsplash.com/photo-1519864600265-abb23847ef5c?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    id: "sweet",
    title: "شیرینی",
    products: [
      {
        id: "3",
        name: "شیرینی خامه‌ای",
        desc: "شیرینی خامه‌ای تازه و خوشمزه با طعم عالی.",
        price: 50000,
        stock: 8,
        image: "https://images.unsplash.com/photo-1519864600265-abb23847ef5c?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "4",
        name: "شیرینی نارگیلی",
        desc: "شیرینی نارگیلی نرم و معطر.",
        price: 32000,
        stock: 10,
        image: "https://images.unsplash.com/photo-1464306076886-debede14d7b1?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    id: "veggie",
    title: "سبزیجات",
    products: [
      {
        id: "5",
        name: "سبزیجات آماده",
        desc: "سبزیجات تازه و پاک شده برای آشپزی و سالاد.",
        price: 30000,
        stock: 22,
        image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "6",
        name: "ریحان تازه",
        desc: "ریحان تازه و خوش‌عطر مناسب غذا و سالاد.",
        price: 12000,
        stock: 18,
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80"
      }
    ]
  }
];

// بنر فروشگاه با عکس حرفه‌ای Unsplash
const BANNER_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
const BASE_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function HomePage() {
  const { addToCart } = useCart();
  const [activeCat, setActiveCat] = useState(categories[0].id);
  const [query, setQuery] = useState("");

  // Use the new paginated API hook
  const {
    data: fetchedProducts,
    loading,
    loadingMore,
    error: apiError,
    hasMore,
    loadMore,
    refresh
  } = usePaginatedApi(`${BASE_API}/api/products`, {
    pageSize: 12,
    searchQuery: query,
    dependencies: []
  });

  const activeProducts = useMemo(() => 
    categories.find(c => c.id === activeCat)?.products || [], 
    [activeCat]
  );

  const handleCategoryChange = useCallback((catId) => {
    setActiveCat(catId);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const handleAddToCart = useCallback((product) => {
    addToCart({ 
      id: product._id, 
      name: product.name, 
      category: product.category?.name, 
      price: Number(product.price) || 0, 
      images: [product.image], 
      quantity: 1 
    });
  }, [addToCart]);

  const [hero, setHero] = useState({ title: 'بیگ‌بیر - سوپرمارکت آنلاین', subtitle: 'تازه‌ترین محصولات، ارسال سریع، پرداخت اعتباری', slides: [] });
  useEffect(()=>{
    (async()=>{
      try {
        const r = await fetch(`${BASE_API}/api/settings`, { cache: 'no-store' });
        const d = await r.json();
        if (r.ok && d?.settings?.hero) setHero(d.settings.hero);
      } catch(_) {}
    })();
  },[]);

  return (
    <div className={styles.mainRoot}>
      <Banner title={hero.title} subtitle={hero.subtitle} slides={hero.slides} />

      {/* دسته‌بندی‌ها */}
      <div className={styles.categoriesTabs}>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.catTab} ${activeCat === cat.id ? styles.active : ""}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* جستجو */}
      <div className={styles.searchContainer}>
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="جستجوی محصول..." 
          className={styles.searchInput}
        />
        <button 
          onClick={handleSearchSubmit} 
          className={styles.searchButton}
        >
          جستجو
        </button>
      </div>

      {/* محصولات دسته انتخاب شده */}
      <div className={styles.productsSection}>
        <h2 className={styles.productsTitle}>
          {categories.find(c => c.id === activeCat)?.title}
        </h2>
        <div className={styles.productsList}>
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonImg} />
                <div style={{ width: '100%' }}>
                  <div className={styles.skeletonLine} style={{ width: '60%', height: 14 }} />
                  <div className={styles.skeletonLine} style={{ width: '90%', height: 12, marginTop: 6 }} />
                  <div className={styles.skeletonLine} style={{ width: '40%', height: 14, marginTop: 8 }} />
                </div>
              </div>
            ))
          ) : apiError ? (
            <div className={styles.emptyProducts}>
              خطا در دریافت محصولات: {apiError}
              <button onClick={refresh} className={styles.searchButton} style={{ marginTop: 16 }}>
                تلاش مجدد
              </button>
            </div>
          ) : fetchedProducts.length > 0 ? (
            fetchedProducts.map((p, index) => (
              <LazyWrapper
                key={p._id}
                fallback={
                  <div className={styles.skeleton}>
                    <div className={styles.skeletonImg} />
                    <div style={{ width: '100%' }}>
                      <div className={styles.skeletonLine} style={{ width: '60%', height: 14 }} />
                      <div className={styles.skeletonLine} style={{ width: '90%', height: 12, marginTop: 6 }} />
                      <div className={styles.skeletonLine} style={{ width: '40%', height: 14, marginTop: 8 }} />
                    </div>
                  </div>
                }
                threshold={index < 6 ? 0 : 0.1} // Load first 6 immediately
                rootMargin={index < 6 ? '0px' : '100px'}
              >
                <ProductCard 
                  product={p} 
                  onAdd={() => handleAddToCart(p)} 
                />
              </LazyWrapper>
            ))
          ) : activeProducts.length === 0 ? (
            <div className={styles.emptyProducts}>هنوز محصولی در این دسته نیست.</div>
          ) : (
            activeProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={{ ...p, description: p.desc }} 
                onAdd={() => addToCart({ 
                  id: p.id, 
                  name: p.name, 
                  category: categories.find(c => c.products.some(pp => pp.id === p.id))?.title || '', 
                  price: p.price, 
                  images: [p.image], 
                  quantity: 1 
                })} 
              />
            ))
          )}
        </div>
        {(!loading && fetchedProducts.length > 0) && (
          <div className={styles.loadMoreContainer}>
            {hasMore ? (
              <button
                className={styles.loadMoreButton}
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? 'در حال بارگذاری...' : 'مشاهده بیشتر'}
              </button>
            ) : (
              <span className={styles.loadMoreText}>تمام شد</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
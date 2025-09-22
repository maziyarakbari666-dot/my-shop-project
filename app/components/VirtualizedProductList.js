'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ProductCard from './ProductCard';

const ITEM_HEIGHT = 400; // Approximate height of ProductCard
const BUFFER_SIZE = 3; // Number of items to render outside visible area

export default function VirtualizedProductList({ 
  products, 
  onAddToCart, 
  containerHeight = 600 
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      products.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, products.length]);

  const visibleProducts = useMemo(() => {
    return products.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [products, visibleRange.startIndex, visibleRange.endIndex]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const totalHeight = products.length * ITEM_HEIGHT;
  const offsetY = visibleRange.startIndex * ITEM_HEIGHT;

  return (
    <div
      ref={setContainerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '28px',
            justifyContent: 'center',
            padding: '0 16px'
          }}
        >
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={`${visibleRange.startIndex + index}-${product._id || product.id}`}
              product={product}
              onAdd={() => onAddToCart(product)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

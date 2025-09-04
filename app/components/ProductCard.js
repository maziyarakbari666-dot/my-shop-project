import React from "react";

export default function ProductCard({ product, addToCart }) {
  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img src={product.image} alt={product.name} className="product-img" />
        {product.stock === 0 && <span className="img-badge">ناموجود</span>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.desc}</p>
        <div className="product-bottom">
          <span className="product-price">
            <span className="icon-price">💵</span>{product.price.toLocaleString()} تومان
          </span>
          <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
            {product.stock > 0 ? `موجود (${product.stock})` : "ناموجود"}
          </span>
        </div>
        <button
          className="add-cart-btn"
          disabled={product.stock === 0}
          onClick={() => addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            images: [product.image],
            quantity: 1,
          })}
        >
          <span className="icon-cart">🛒</span> خرید سریع
        </button>
      </div>
    </div>
  );
}
import React from "react";

export default function CategoryTabs({ categories, activeCat, setActiveCat }) {
  return (
    <div className="categories-tabs">
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`cat-tab ${activeCat === cat.id ? "active" : ""}`}
          onClick={() => setActiveCat(cat.id)}
        >
          {cat.title}
        </button>
      ))}
    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-[11px] text-gray-400 ml-1">{rating}</span>
    </span>
  );
}

export default function ProductCard({ product, className = "" }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const wished = isInWishlist(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  function handleAdd(e) {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  function handleWish(e) {
    e.preventDefault();
    toggleWishlist(product);
  }

  return (
    <Link to={`/products/${product.id}`} className="no-underline">
      <div className={`bg-white rounded-xl shadow-card overflow-hidden flex flex-col cursor-pointer relative transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg ${className}`}>

        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10">
            -{discount}%
          </span>
        )}

        <button
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none shadow-sm transition-colors duration-150 ${wished ? "bg-red-50" : "bg-white/90"}`}
          onClick={handleWish}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={wished ? "#ef4444" : "none"}
            stroke={wished ? "#ef4444" : "#9ca3af"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <img src={product.image} alt={product.name} className="w-full h-40 object-cover bg-slate-50" loading="lazy" />

        <div className="p-3.5 flex flex-col gap-1.5 flex-1">
          <span className="text-[11px] text-brand font-semibold uppercase tracking-wide">{product.category}</span>
          <div className="text-sm font-semibold leading-snug text-gray-800">{product.name}</div>
          <Stars rating={product.rating} />
          <div className="flex items-center gap-1.5 mt-auto">
            <span className="text-base font-bold text-brand">${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button
            className={`w-full mt-2 py-2 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors duration-150 ${added ? "bg-brand-dark" : "bg-brand hover:bg-brand-dark"}`}
            onClick={handleAdd}
          >
            {added ? "✓ Added!" : "Add to Cart"}
          </button>
        </div>

      </div>
    </Link>
  );
}

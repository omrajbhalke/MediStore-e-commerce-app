import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { products } from "../data/products";
import { useCart } from "../hooks/useCart";
import ProductCard from "../components/product/ProductCard";

function Stars({ rating, reviews }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="16" height="16" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-sm text-gray-400">{rating} ({reviews} reviews)</span>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id));
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-lg text-gray-400 mb-4">Product not found.</p>
        <Link to="/" className="text-brand font-semibold">← Back to catalog</Link>
      </div>
    );
  }

  const wished = isInWishlist(product.id);
  const savings = ((product.originalPrice - product.price) * qty).toFixed(2);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  function handleAdd() {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="page-container">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link to="/" className="text-brand">Home</Link>
        <span>›</span>
        <span>{product.category}</span>
        <span>›</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-10 mb-12">

        {/* Image */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden aspect-square flex items-center justify-center">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3.5">
          <span className="text-xs font-bold text-brand uppercase tracking-wider">{product.category}</span>
          <h1 className="font-display text-[28px] font-normal leading-snug text-gray-800">{product.name}</h1>
          <Stars rating={product.rating} reviews={product.reviews} />

          {/* Price */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold text-brand">${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-base text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save ${savings}</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="px-4 py-3 rounded-lg border border-gray-200 text-sm">
            <span className={`font-semibold ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.stock > 0 ? "✓ In Stock" : "Out of Stock"}
            </span>
            {product.stock > 0 && (
              <span className="text-gray-400 text-xs ml-2">{product.stock} available</span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-400">Quantity</span>
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg hover:bg-gray-100 transition-colors" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="text-base font-bold min-w-[32px] text-center">{qty}</span>
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg hover:bg-gray-100 transition-colors" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
            <span className="text-xs text-gray-400">1–{product.stock}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              className={`flex-1 py-3 rounded-xl text-white text-base font-bold border-none cursor-pointer transition-colors ${added ? "bg-brand-dark" : "bg-brand hover:bg-brand-dark"} disabled:opacity-50`}
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {added ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
            <button
              className={`px-4 py-3 rounded-xl border border-gray-200 cursor-pointer flex items-center gap-1.5 text-sm transition-colors hover:bg-gray-50 ${wished ? "text-red-500 border-red-200 bg-red-50" : "text-gray-400 bg-transparent"}`}
              onClick={() => toggleWishlist(product)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"
                fill={wished ? "#ef4444" : "none"}
                stroke={wished ? "#ef4444" : "currentColor"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {wished ? "Saved" : "Wishlist"}
            </button>
          </div>

          <p className="text-sm leading-relaxed text-gray-400">{product.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-brand-light text-brand text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Related Products</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

    </div>
  );
}

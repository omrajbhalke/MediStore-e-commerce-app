import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <div className="grid place-items-center py-16 text-center text-gray-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p className="text-base font-medium text-gray-600 mb-1">No products found</p>
        <p className="text-sm">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 0.04}s` }}
        />
      ))}
    </div>
  );
}

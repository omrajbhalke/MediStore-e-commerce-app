import { CATEGORIES } from "../../data/products";

export default function ProductFilters({ filters, onChange, maxProductPrice }) {
  function update(key, val) {
    onChange({ ...filters, [key]: val });
  }

  return (
    <aside className="bg-white rounded-xl shadow-card p-5 h-fit sticky top-[92px] min-w-[200px]">
      <div className="text-sm font-bold mb-4 text-gray-800">Filter & Sort</div>

      {/* Category */}
      <div className="mb-5">
        <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-sm mb-1 border-none cursor-pointer transition-colors duration-150
              ${filters.category === cat
                ? "bg-brand-light text-brand font-semibold"
                : "bg-transparent text-gray-700 hover:bg-gray-50"
              }`}
            onClick={() => update("category", cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Price range */}
      <div className="mb-5">
        <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Max Price</span>
        <input
          type="range" min={5} max={maxProductPrice || 60}
          value={filters.maxPrice || maxProductPrice || 60}
          onChange={(e) => update("maxPrice", Number(e.target.value))}
          className="w-full accent-brand"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>$5</span>
          <span className="text-brand font-semibold">${filters.maxPrice || maxProductPrice || 60}</span>
        </div>
      </div>

      {/* Sort */}
      <div className="mb-5">
        <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Sort By</span>
        <select
          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-gray-50 outline-none cursor-pointer"
          value={filters.sort || ""}
          onChange={(e) => update("sort", e.target.value)}
        >
          <option value="">Default</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="rating">Highest Rated</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <button
        className="w-full py-2 rounded-lg border border-brand text-brand bg-transparent text-sm font-semibold cursor-pointer hover:bg-brand-light transition-colors duration-150"
        onClick={() => onChange({ category: "All", sort: "", maxPrice: maxProductPrice || 60 })}
      >
        Reset Filters
      </button>
    </aside>
  );
}

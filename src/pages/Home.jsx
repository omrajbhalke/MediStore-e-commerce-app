import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { products } from "../data/products";
import { filterProducts } from "../utils/filters";
import ProductGrid from "../components/product/ProductGrid";
import ProductFilters from "../components/product/ProductFilters";

const MAX_PRICE = Math.ceil(Math.max(...products.map((p) => p.price)));

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [filters, setFilters] = useState({
    category: "All",
    sort: "",
    maxPrice: MAX_PRICE,
  });

  const filtered = useMemo(
    () => filterProducts(products, { ...filters, search: searchQuery }),
    [filters, searchQuery]
  );

  return (
    <div className="page-container">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-9 mb-7 text-white overflow-hidden animate-fade-up">
        <div className="absolute -top-5 -right-5 w-44 h-44 rounded-full bg-white/[0.07]" />
        <div className="absolute right-16 -bottom-10 w-28 h-28 rounded-full bg-white/[0.05]" />
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1.5">Your trusted health partner</p>
        <h1 className="font-display text-3xl font-normal leading-tight mb-2">
          Medicine & Wellness,<br />Delivered Fast
        </h1>
        <p className="text-sm opacity-75 max-w-sm">
          Quality supplements, first aid, and medical devices — all in one place.
        </p>
      </div>

      {/* Layout */}
      <div className="flex gap-6 items-start">
        <ProductFilters filters={filters} onChange={setFilters} maxProductPrice={MAX_PRICE} />

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">
              {searchQuery && <><strong className="text-gray-700">"{searchQuery}"</strong> — </>}
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <ProductGrid products={filtered} />
        </div>
      </div>

    </div>
  );
}

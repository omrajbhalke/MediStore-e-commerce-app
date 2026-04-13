import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  function handleSearch(q) {
    navigate(`/?search=${encodeURIComponent(q)}`);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto h-full flex items-center gap-5 px-5">

        <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
          <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center text-white text-lg font-bold">
            M
          </div>
          <span className="font-display text-[22px] text-brand tracking-tight">
            MEDISTORE
          </span>
        </Link>

        <div className="flex-1 max-w-md">
          <SearchBar
            value={search}
            onChange={setSearch}
            onSearch={handleSearch}
            placeholder="Search medicines, supplements…"
          />
        </div>

        <div className="ml-auto">
          <Link to="/cart" className="relative no-underline">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors cursor-pointer border-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-badge-pop px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>
        </div>

      </div>
    </nav>
  );
}

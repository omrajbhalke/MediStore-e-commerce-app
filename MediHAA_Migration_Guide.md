# MediHAA Migration Guide
### Upgrading `vm_src_dump` → `src_dump` style (Indian Medical Site)

> **Goal:** Keep vm_src_dump's Indian identity (₹, MediHAA brand, Indian products, Footer, logo),
> but upgrade its logic, structure, and UI quality to match src_dump.
> Final project name: **MediHAA**

---

## OVERVIEW OF WHAT CHANGES

| Area | vm_src_dump (current) | src_dump (target) |
|---|---|---|
| CSS setup | `@import "tailwindcss"` + CSS vars | Tailwind config + `@layer` utilities |
| App wrapper | BrowserRouter + CartProvider in `main.jsx` | BrowserRouter + CartProvider in `App.jsx` |
| Cart state | plain `useState` + raw `useEffect` | `useLocalStorage` hook |
| useCart hook | `useContext` only | `useContext` + pricing calculations |
| Coupon system | only `SAVE10`, string | multiple coupons, object-based |
| Product data | `data/product.js` (Indian, 25 items) | `data/products.js` (12 items, USD) |
| Filters | separate props (search, category, sort) | single `filters` object |
| ProductFilters | inline in Home, basic inputs | sidebar component, sticky |
| ProductCard | basic, no wishlist, no discount badge | wishlist, discount %, stock check |
| ProductDetails | thumbnail gallery, no qty selector | qty selector, wishlist, related |
| Cart page | basic list + total | polished panels, clear cart button |
| Checkout page | just a button + alert | full form, validation, payment UI |
| Navbar | logo image, mobile hamburger | text logo, integrated SearchBar |
| SearchBar | standalone unused component | functional, connected to Home |
| Loader | missing | `components/common/Loader.jsx` |
| Currency | ₹ (correct for India) | $ (needs to stay ₹) |

---

## STEP 1 — Restructure `index.css`

**File: `src/index.css`**

Replace the entire file with this. Keep your color palette (`#2AA7A1`, `#F5FAFF`) but adopt the src_dump layer structure and add the brand CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --nav-h: 68px;
    --brand: #2AA7A1;
    --brand-dark: #23918c;
  }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: 'Geist', system-ui, sans-serif;
    background: #F5FAFF;
    color: #08060d;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 9999px; }
}

@layer utilities {
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 20px;
    padding-top: calc(var(--nav-h) + 24px);
  }
}
```

> **Why:** src_dump uses `page-container` utility class everywhere in pages. Without it, the layout breaks.

---

## STEP 2 — Update `tailwind.config.js`

If you don't have one, create `tailwind.config.js` in the root:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2AA7A1",
        "brand-dark": "#23918c",
        "brand-light": "rgba(42,167,161,0.1)",
        accent: "#ef4444",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
        "card-lg": "0 10px 25px rgba(0,0,0,0.12)",
      },
      animation: {
        "spin-slow": "spin 1s linear infinite",
        "fade-up": "fadeUp 0.3s ease both",
        "badge-pop": "badgePop 0.2s ease both",
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        badgePop: { from: { transform: "scale(0)" }, to: { transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
```

---

## STEP 3 — Update `App.jsx`

Move `BrowserRouter` and `CartProvider` into `App.jsx` (like src_dump). Keep your `Footer`.

```jsx
// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import CartProvider from "./context/CartContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />
        <AppRoutes />
        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
}
```

---

## STEP 4 — Update `main.jsx`

Remove `BrowserRouter` and `CartProvider` from here since they moved to `App.jsx`:

```jsx
// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## STEP 5 — Create `hooks/useLocalStorage.js`

This hook is used by the upgraded `CartContext`. Create a new file:

```js
// src/hooks/useLocalStorage.js
import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (e) {
      console.error(e);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
```

---

## STEP 6 — Upgrade `data/product.js` → rename to `data/products.js`

**Keep your Indian products and ₹ prices.** But add missing fields (`originalPrice`, `tags`, `reviews`) that the new components need. Also rename the file to `products.js` and add `CATEGORIES` and `COUPONS` exports.

Rename the file from `product.js` to `products.js`, then replace the content:

```js
// src/data/products.js
export const products = [
  {
    id: "p1",
    name: "Paracetamol Tablets 500mg",
    price: 50,
    originalPrice: 65,
    category: "Tablets",
    rating: 4.6,
    reviews: 210,
    stock: 120,
    image: "https://www.abibapharmacia.com/wp-content/uploads/2022/08/Diptamp-500-Tab.jpg",
    description: "Used to treat fever and mild to moderate pain. Safe for adults and children above 12 years.",
    tags: ["fever", "pain", "headache"],
  },
  {
    id: "p2",
    name: "Cough Syrup (Herbal)",
    price: 120,
    originalPrice: 150,
    category: "Syrup",
    rating: 4.4,
    reviews: 95,
    stock: 80,
    image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=300&fit=crop",
    description: "Relieves dry and wet cough naturally. Herbal formula, safe for all ages.",
    tags: ["cough", "cold", "throat"],
  },
  {
    id: "p3",
    name: "Digital Thermometer",
    price: 250,
    originalPrice: 350,
    category: "Devices",
    rating: 4.5,
    reviews: 132,
    stock: 60,
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=300&fit=crop",
    description: "Accurate body temperature measurement in 10 seconds. Large LCD display.",
    tags: ["fever", "temperature", "diagnostic"],
  },
  {
    id: "p4",
    name: "Adhesive Bandages (Pack of 20)",
    price: 40,
    originalPrice: 55,
    category: "First Aid",
    rating: 4.3,
    reviews: 178,
    stock: 200,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&h=300&fit=crop",
    description: "Protects small cuts and wounds. Water-resistant and breathable.",
    tags: ["cuts", "wounds", "first aid"],
  },
  {
    id: "p5",
    name: "Antiseptic Liquid",
    price: 95,
    originalPrice: 120,
    category: "First Aid",
    rating: 4.7,
    reviews: 88,
    stock: 75,
    image: "https://images.unsplash.com/photo-1576073719676-aa95576db207?w=300&h=300&fit=crop",
    description: "Prevents infection in minor cuts and wounds. 250ml bottle.",
    tags: ["antiseptic", "wounds", "infection"],
  },
  {
    id: "p6",
    name: "Ibuprofen Tablets",
    price: 90,
    originalPrice: 110,
    category: "Tablets",
    rating: 4.5,
    reviews: 145,
    stock: 110,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
    description: "Reduces inflammation and pain. 400mg per tablet. Strip of 10.",
    tags: ["pain", "inflammation", "fever"],
  },
  {
    id: "p7",
    name: "Vitamin C Tablets",
    price: 150,
    originalPrice: 199,
    category: "Supplements",
    rating: 4.6,
    reviews: 220,
    stock: 95,
    image: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=300&h=300&fit=crop",
    description: "Boosts immunity and fights infections. 500mg per tablet, 30 tablets.",
    tags: ["immunity", "vitamin", "cold"],
  },
  {
    id: "p8",
    name: "ORS Sachets (Pack of 10)",
    price: 30,
    originalPrice: 40,
    category: "General",
    rating: 4.7,
    reviews: 310,
    stock: 140,
    image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&h=300&fit=crop",
    description: "Prevents dehydration. WHO-formula oral rehydration salts.",
    tags: ["dehydration", "diarrhea", "energy"],
  },
  {
    id: "p9",
    name: "Pain Relief Spray",
    price: 180,
    originalPrice: 220,
    category: "General",
    rating: 4.4,
    reviews: 67,
    stock: 50,
    image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&h=300&fit=crop",
    description: "Instant relief from muscle pain and sprains. 100ml spray.",
    tags: ["muscle pain", "sprain", "back pain"],
  },
  {
    id: "p10",
    name: "Hand Sanitizer 500ml",
    price: 160,
    originalPrice: 200,
    category: "Hygiene",
    rating: 4.8,
    reviews: 410,
    stock: 130,
    image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&h=300&fit=crop",
    description: "Kills 99.9% germs without water. WHO-recommended formula.",
    tags: ["germs", "hygiene", "sanitizer"],
  },
  {
    id: "p11",
    name: "Multivitamin Capsules",
    price: 220,
    originalPrice: 280,
    category: "Supplements",
    rating: 4.7,
    reviews: 195,
    stock: 100,
    image: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=300&h=300&fit=crop",
    description: "Daily nutritional support. 30 capsules with 20+ vitamins & minerals.",
    tags: ["immunity", "nutrition", "vitamins"],
  },
  {
    id: "p12",
    name: "Blood Pressure Monitor",
    price: 1800,
    originalPrice: 2200,
    category: "Devices",
    rating: 4.7,
    reviews: 88,
    stock: 25,
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=300&h=300&fit=crop",
    description: "Monitors blood pressure at home. Clinically validated, stores 60 readings.",
    tags: ["bp", "heart health", "monitoring"],
  },
];

export const CATEGORIES = ["All", "Tablets", "Syrup", "Supplements", "First Aid", "Devices", "General", "Hygiene"];

export const COUPONS = {
  SAVE10: { discount: 0.10, type: "percent", label: "10% off" },
  MEDI5:  { discount: 50,   type: "flat",    label: "₹50 off" },
  HEALTH20: { discount: 0.20, type: "percent", label: "20% off" },
};
```

> **Note:** You can add more products from your original list following the same structure.

---

## STEP 7 — Upgrade `utils/pricing.js`

Replace the entire file (remove the `import React`):

```js
// src/utils/pricing.js
export const TAX_RATE = 0.05;

export function calcSubtotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calcTax(subtotal) {
  return parseFloat((subtotal * TAX_RATE).toFixed(2));
}

export function calcDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  if (coupon.type === "percent") return parseFloat((subtotal * coupon.discount).toFixed(2));
  if (coupon.type === "flat") return Math.min(coupon.discount, subtotal);
  return 0;
}

export function calcTotal(subtotal, tax, discount) {
  return parseFloat((subtotal + tax - discount).toFixed(2));
}
```

---

## STEP 8 — Upgrade `utils/filters.js`

Replace with src_dump version (accepts a single `filters` object):

```js
// src/utils/filters.js
export function filterProducts(products, { search, category, maxPrice, sort }) {
  let result = [...products];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.includes(q))
    );
  }

  if (category && category !== "All") {
    result = result.filter((p) => p.category === category);
  }

  if (maxPrice !== undefined) {
    result = result.filter((p) => p.price <= maxPrice);
  }

  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
  else if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}
```

---

## STEP 9 — Upgrade `context/CartContext.jsx`

Replace fully. Uses `useLocalStorage`, multi-coupon support, wishlist:

```jsx
// src/context/CartContext.jsx
import { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { COUPONS } from "../data/products";

const CartContext = createContext(null);

export default function CartProvider({ children }) {
  const [cartItems, setCartItems] = useLocalStorage("medihaa-cart", []);
  const [appliedCoupon, setAppliedCoupon] = useLocalStorage("medihaa-coupon", null);
  const [wishlist, setWishlist] = useLocalStorage("medihaa-wishlist", []);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = product.stock
          ? Math.min(existing.quantity + quantity, product.stock)
          : existing.quantity + quantity;
        return prev.map((i) => i.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { ...product, quantity: Math.min(quantity, product.stock || 99) }];
    });
  }, [setCartItems]);

  const removeFromCart = useCallback((id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, [setCartItems]);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        return { ...i, quantity: i.stock ? Math.min(quantity, i.stock) : quantity };
      })
    );
  }, [setCartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
  }, [setCartItems, setAppliedCoupon]);

  const applyCoupon = useCallback((code) => {
    const coupon = COUPONS[code.toUpperCase()];
    if (coupon) {
      setAppliedCoupon({ code: code.toUpperCase(), ...coupon });
      return { success: true, label: coupon.label };
    }
    return { success: false };
  }, [setAppliedCoupon]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, [setAppliedCoupon]);

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) =>
      prev.find((i) => i.id === product.id)
        ? prev.filter((i) => i.id !== product.id)
        : [...prev, product]
    );
  }, [setWishlist]);

  const isInWishlist = useCallback((id) => wishlist.some((i) => i.id === id), [wishlist]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, appliedCoupon, wishlist, cartCount,
      addToCart, removeFromCart, updateQuantity, clearCart,
      applyCoupon, removeCoupon, toggleWishlist, isInWishlist,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
```

---

## STEP 10 — Upgrade `hooks/useCart.js`

```js
// src/hooks/useCart.js
import { useCartContext } from "../context/CartContext";
import { calcSubtotal, calcTax, calcDiscount, calcTotal } from "../utils/pricing";

export default function useCart() {
  const cart = useCartContext();
  const subtotal = calcSubtotal(cart.cartItems);
  const tax = calcTax(subtotal);
  const discount = calcDiscount(subtotal, cart.appliedCoupon);
  const total = calcTotal(subtotal, tax, discount);
  return { ...cart, subtotal, tax, discount, total };
}
```

> **Note:** Export is now `default` (keeps compatibility with your existing vm imports).

---

## STEP 11 — Create `components/common/Loader.jsx`

New file — used in loading states:

```jsx
// src/components/common/Loader.jsx
export default function Loader({ text = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-9 h-9 border-4 border-gray-200 border-t-brand rounded-full animate-spin-slow" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
```

---

## STEP 12 — Upgrade `components/common/Navbar.jsx`

Keep your logo image, mobile menu, and MediHAA branding. Add the cart count badge and connect search:

```jsx
// src/components/common/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import useCart from "../../hooks/useCart";

export default function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(e) {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setMenuOpen(false);
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-white border-b border-[#6B8A9B]/30 shadow-sm">
      <div className="max-w-[1200px] mx-auto h-full flex items-center gap-5 px-5">

        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src={logo} className="h-12 w-auto" alt="MediHAA logo" />
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 items-center bg-[#F5FAFF] border border-[#6B8A9B] rounded-full px-4 py-2 max-w-xl">
          <svg className="w-4 h-4 text-zinc-500 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search medicines, supplements…"
            className="bg-transparent outline-none text-sm w-full text-zinc-700 placeholder-zinc-400"
          />
          {search && (
            <button onClick={() => { setSearch(""); navigate("/"); }} className="text-zinc-400 text-lg ml-1">×</button>
          )}
        </div>

        {/* Cart */}
        <div className="ml-auto relative">
          <Link to="/cart">
            <button className="flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-md bg-[#2AA7A1] hover:bg-[#23918c] cursor-pointer transition-colors border-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 cursor-pointer bg-transparent border-0 p-1"
        >
          <span className={`block w-6 h-0.5 bg-zinc-800 transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
          <span className={`block w-6 h-0.5 bg-zinc-800 transition-opacity ${menuOpen ? "opacity-0" : ""}`}></span>
          <span className={`block w-6 h-0.5 bg-zinc-800 transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-zinc-200 flex flex-col p-5 gap-3 md:hidden z-50">
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-zinc-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search..." className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>
            <button className="flex items-center justify-center gap-2 bg-[#2AA7A1] text-white text-sm font-medium px-5 py-2.5 rounded-full w-full border-none cursor-pointer">
              Cart {cartCount > 0 && `(${cartCount})`}
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}
```

---

## STEP 13 — Upgrade `components/cart/CartItem.jsx`

Better styling, stock max check, price display in ₹:

```jsx
// src/components/cart/CartItem.jsx
import useCart from "../../hooks/useCart";

export default function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCart();

  return (
    <div className="flex gap-3.5 py-4 border-b border-gray-100 items-start">
      <img src={item.image} alt={item.name} className="w-[72px] h-[72px] object-cover rounded-lg shrink-0 bg-slate-50" />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800 mb-0.5">{item.name}</div>
        <div className="text-xs text-gray-400 mb-2">{item.category}</div>
        <div className="flex items-center gap-2">
          <button
            className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg leading-none hover:bg-gray-100 transition-colors disabled:opacity-40"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >−</button>
          <span className="text-sm font-semibold min-w-[22px] text-center">{item.quantity}</span>
          <button
            className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg leading-none hover:bg-gray-100 transition-colors disabled:opacity-40"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.stock && item.quantity >= item.stock}
          >+</button>
          {item.stock && item.quantity >= item.stock && (
            <span className="text-[11px] text-red-500">Max stock</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className="text-[15px] font-bold text-brand">₹{(item.price * item.quantity).toFixed(2)}</span>
        <button
          className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
          onClick={() => removeFromCart(item.id)}
          title="Remove"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
```

---

## STEP 14 — Upgrade `components/cart/CartSummary.jsx`

```jsx
// src/components/cart/CartSummary.jsx
import useCart from "../../hooks/useCart";

export default function CartSummary({ children }) {
  const { subtotal, tax, discount, total, appliedCoupon } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-card p-6 sticky top-[92px]">
      <div className="text-base font-bold text-gray-800 mb-5">Cart Summary</div>

      <div className="flex justify-between items-center py-2 text-sm text-gray-500">
        <span>Subtotal</span>
        <span className="text-gray-800 font-medium">₹{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center py-2 text-sm text-gray-500">
        <span>Tax (5% GST)</span>
        <span className="text-gray-800 font-medium">₹{tax.toFixed(2)}</span>
      </div>
      {appliedCoupon && (
        <div className="flex justify-between items-center py-2 text-sm text-gray-500">
          <span>Discount ({appliedCoupon.code})</span>
          <span className="text-red-500 font-semibold">−₹{discount.toFixed(2)}</span>
        </div>
      )}

      <div className="h-px bg-gray-100 my-3" />

      <div className="flex justify-between items-center py-1 text-[17px] font-bold text-gray-800">
        <span>Grand Total</span>
        <span className="text-brand text-xl">₹{total.toFixed(2)}</span>
      </div>

      {children}
    </div>
  );
}
```

---

## STEP 15 — Upgrade `components/cart/CouponBox.jsx`

Multi-coupon support. Try: `SAVE10`, `MEDI5`, `HEALTH20`:

```jsx
// src/components/cart/CouponBox.jsx
import { useState } from "react";
import useCart from "../../hooks/useCart";

export default function CouponBox() {
  const { applyCoupon, removeCoupon, appliedCoupon } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);

  function handleApply() {
    if (!code.trim()) return;
    const result = applyCoupon(code.trim());
    if (result.success) {
      setMsg({ type: "success", text: `Coupon applied: ${result.label}` });
      setCode("");
    } else {
      setMsg({ type: "error", text: "Invalid coupon code." });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-5 mt-4">
      <div className="text-sm font-bold text-gray-800 mb-3">Apply Coupon</div>

      {appliedCoupon ? (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-brand-light border border-brand text-sm">
          <span>
            <span className="font-bold text-brand">{appliedCoupon.code}</span>
            <span className="text-gray-500 ml-1.5">— {appliedCoupon.label}</span>
          </span>
          <button className="bg-transparent border-none cursor-pointer text-red-500 text-lg leading-none p-0.5 hover:text-red-700" onClick={removeCoupon}>×</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm uppercase tracking-wider outline-none focus:border-brand transition-colors bg-gray-50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
            <button
              className="px-4 py-2 bg-[#2AA7A1] text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-[#23918c] transition-colors whitespace-nowrap"
              onClick={handleApply}
            >Apply</button>
          </div>
          {msg && (
            <p className={`text-xs mt-1.5 ${msg.type === "success" ? "text-brand" : "text-red-500"}`}>{msg.text}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Try: SAVE10 · MEDI5 · HEALTH20</p>
        </>
      )}
    </div>
  );
}
```

---

## STEP 16 — Upgrade `components/checkout/OrderSummary.jsx`

Replace the comment-only file with actual component:

```jsx
// src/components/checkout/OrderSummary.jsx
import useCart from "../../hooks/useCart";

export default function OrderSummary() {
  const { cartItems, subtotal, tax, discount, total, appliedCoupon } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-card p-6 sticky top-[92px]">
      <div className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Order Summary</div>

      {cartItems.map((item) => (
        <div key={item.id} className="flex gap-2.5 items-center py-2.5 border-b border-gray-100">
          <img src={item.image} alt={item.name} className="w-11 h-11 object-cover rounded-md bg-slate-50 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">{item.name}</div>
            <div className="text-xs text-gray-400">× {item.quantity}</div>
          </div>
          <span className="text-sm font-bold text-brand whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tax (5% GST)</span><span>₹{tax.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Discount ({appliedCoupon.code})</span>
            <span className="text-red-500 font-semibold">−₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="h-px bg-gray-100 my-2" />
        <div className="flex justify-between text-base font-bold text-gray-800">
          <span>Total to Pay</span>
          <span className="text-brand">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 17 — Upgrade `components/product/ProductCard.jsx`

Adds: wishlist heart, discount badge, better "Add to Cart" feedback, ₹:

```jsx
// src/components/product/ProductCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";

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

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const wished = isInWishlist(product.id);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

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
      <div className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col cursor-pointer relative transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg">

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
          <div className="text-sm font-semibold leading-snug text-gray-800 line-clamp-2">{product.name}</div>
          <Stars rating={product.rating} />
          <div className="flex items-center gap-1.5 mt-auto">
            <span className="text-base font-bold text-brand">₹{product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button
            className={`w-full mt-2 py-2 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors duration-150 ${added ? "bg-[#23918c]" : "bg-[#2AA7A1] hover:bg-[#23918c]"}`}
            onClick={handleAdd}
          >
            {added ? "✓ Added!" : "Add to Cart"}
          </button>
        </div>

      </div>
    </Link>
  );
}
```

---

## STEP 18 — Upgrade `components/product/ProductFilters.jsx`

Becomes a sidebar with sticky positioning. Uses unified `filters` object:

```jsx
// src/components/product/ProductFilters.jsx
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
        <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Max Price (₹)</span>
        <input
          type="range" min={30} max={maxProductPrice || 2200}
          value={filters.maxPrice || maxProductPrice || 2200}
          onChange={(e) => update("maxPrice", Number(e.target.value))}
          className="w-full accent-brand"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>₹30</span>
          <span className="text-brand font-semibold">₹{filters.maxPrice || maxProductPrice || 2200}</span>
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
        onClick={() => onChange({ category: "All", sort: "", maxPrice: maxProductPrice || 2200 })}
      >
        Reset Filters
      </button>
    </aside>
  );
}
```

---

## STEP 19 — Upgrade `components/product/ProductGrid.jsx`

Add empty state:

```jsx
// src/components/product/ProductGrid.jsx
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
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

---

## STEP 20 — Upgrade `pages/Home.jsx`

Add hero section, use unified filters object, connect search from URL:

```jsx
// src/pages/Home.jsx
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
      <div className="relative bg-gradient-to-br from-[#2AA7A1] to-[#23918c] rounded-2xl p-9 mb-7 text-white overflow-hidden">
        <div className="absolute -top-5 -right-5 w-44 h-44 rounded-full bg-white/[0.07]" />
        <div className="absolute right-16 -bottom-10 w-28 h-28 rounded-full bg-white/[0.05]" />
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1.5">Your trusted health partner</p>
        <h1 className="text-3xl font-bold leading-tight mb-2">
          Medicines & Wellness,<br />Delivered Across India
        </h1>
        <p className="text-sm opacity-75 max-w-sm">
          Quality medicines, supplements, devices & first aid — all at genuine prices.
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
```

---

## STEP 21 — Upgrade `pages/Cart.jsx`

Better layout, clear cart button, proper empty state:

```jsx
// src/pages/Cart.jsx
import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import CouponBox from "../components/cart/CouponBox";

export default function Cart() {
  const { cartItems, clearCart, cartCount } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200 mb-4">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</p>
          <p className="text-sm text-gray-400 mb-6">Add some products to get started!</p>
          <Link to="/" className="px-6 py-2.5 bg-[#2AA7A1] text-white text-sm font-semibold rounded-lg no-underline hover:bg-[#23918c] transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-800 mb-1">Shopping Cart</h1>
        <p className="text-sm text-gray-400">{cartCount} item{cartCount !== 1 ? "s" : ""} in your cart</p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex justify-between items-center mb-1">
            <div className="text-base font-bold text-gray-800">Cart Items</div>
            <button
              className="text-red-400 hover:text-red-600 text-sm font-medium bg-transparent border-none cursor-pointer transition-colors"
              onClick={clearCart}
            >Clear cart</button>
          </div>
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div>
          <CartSummary>
            <Link
              to="/checkout"
              className="block w-full mt-4 py-3 bg-[#2AA7A1] text-white text-center text-[15px] font-bold rounded-xl no-underline hover:bg-[#23918c] transition-colors"
            >
              Proceed to Checkout →
            </Link>
          </CartSummary>
          <CouponBox />
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 22 — Upgrade `pages/Checkout.jsx`

Full form with validation, payment methods, success modal, ₹:

```jsx
// src/pages/Checkout.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import OrderSummary from "../components/checkout/OrderSummary";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI / PhonePe / GPay" },
  { id: "card", label: "Debit / Credit Card" },
  { id: "cod", label: "Cash on Delivery" },
];

function Field({ name, label, placeholder, span, form, errors, setForm, setErrors }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 text-gray-800 outline-none transition-colors focus:border-brand ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => {
          setForm({ ...form, [name]: e.target.value });
          setErrors({ ...errors, [name]: "" });
        }}
      />
      {errors[name] && <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );
}

export default function Checkout() {
  const { cartItems, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [payment, setPayment] = useState("upi");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "",
    city: "", state: "", pincode: "", email: "", phone: "",
  });
  const [errors, setErrors] = useState({});

  if (cartItems.length === 0 && !success) {
    return (
      <div className="page-container text-center py-16">
        <p className="text-base text-gray-400 mb-4">No items to checkout.</p>
        <Link to="/" className="text-brand font-semibold">← Back to shop</Link>
      </div>
    );
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.pincode.trim()) e.pincode = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    return e;
  }

  function handlePlace() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSuccess(true);
    clearCart();
  }

  const fieldProps = { form, errors, setForm, setErrors };

  return (
    <div className="page-container">

      {success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-[90%] shadow-card-lg">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Order Placed!</h2>
            <p className="text-sm text-gray-400 mb-6">
              Thank you for choosing MediHAA. Your medicines will be delivered soon.
            </p>
            <button
              className="w-full py-3 bg-[#2AA7A1] text-white text-base font-bold rounded-xl border-none cursor-pointer hover:bg-[#23918c] transition-colors"
              onClick={() => navigate("/")}
            >
              Back to Shop
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link to="/" className="text-brand">Home</Link>
        <span>›</span>
        <Link to="/cart" className="text-brand">Cart</Link>
        <span>›</span>
        <span>Checkout</span>
      </div>

      <h1 className="text-[28px] font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div>
          {/* Shipping */}
          <div className="bg-white rounded-xl shadow-card p-7 mb-5">
            <div className="text-base font-bold text-gray-800 mb-5">Delivery Address</div>
            <div className="grid grid-cols-2 gap-3.5">
              <Field name="firstName" label="First Name" placeholder="Rahul" {...fieldProps} />
              <Field name="lastName" label="Last Name" placeholder="Sharma" {...fieldProps} />
              <Field name="address" label="Full Address" placeholder="123, MG Road, Apartment 4B" span {...fieldProps} />
              <Field name="city" label="City" placeholder="Mumbai" {...fieldProps} />
              <Field name="state" label="State" placeholder="Maharashtra" {...fieldProps} />
              <Field name="pincode" label="PIN Code" placeholder="400001" {...fieldProps} />
              <Field name="email" label="Email" placeholder="rahul@example.com" span {...fieldProps} />
              <Field name="phone" label="Mobile Number" placeholder="+91 98765 43210" span {...fieldProps} />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-card p-7">
            <div className="text-base font-bold text-gray-800 mb-5">Payment Method</div>

            <div className="grid grid-cols-1 gap-2.5 mb-5">
              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer text-sm transition-colors ${payment === m.id ? "border-brand bg-brand-light text-brand" : "border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setPayment(m.id)}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${payment === m.id ? "border-brand" : "border-gray-300"}`}>
                    {payment === m.id && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  {m.label}
                </div>
              ))}
            </div>

            {payment === "card" && (
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Card Number</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Expiry</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="MM/YY" maxLength={5} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">CVV</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="•••" maxLength={4} type="password" />
                </div>
              </div>
            )}

            {payment === "upi" && (
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">UPI ID</label>
                <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="yourname@upi" />
              </div>
            )}

            <button
              className="w-full py-3.5 bg-[#2AA7A1] text-white text-base font-bold rounded-xl border-none cursor-pointer hover:bg-[#23918c] transition-colors"
              onClick={handlePlace}
            >
              Place Order — ₹{total.toFixed(2)}
            </button>
          </div>
        </div>

        <OrderSummary />
      </div>
    </div>
  );
}
```

---

## STEP 23 — Upgrade `pages/ProductDetails.jsx`

Add quantity selector, wishlist button, related products, ₹:

```jsx
// src/pages/ProductDetails.jsx
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { products } from "../data/products";
import useCart from "../hooks/useCart";
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
  const product = products.find((p) => p.id === id);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-lg text-gray-400 mb-4">Product not found.</p>
        <Link to="/" className="text-brand font-semibold">← Back to catalogue</Link>
      </div>
    );
  }

  const wished = isInWishlist(product.id);
  const savings = product.originalPrice
    ? ((product.originalPrice - product.price) * qty).toFixed(2)
    : 0;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  function handleAdd() {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="page-container">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
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
          <h1 className="text-[28px] font-bold leading-snug text-gray-800">{product.name}</h1>
          <Stars rating={product.rating} reviews={product.reviews} />

          {/* Price */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold text-brand">₹{product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-base text-gray-400 line-through">₹{product.originalPrice.toFixed(2)}</span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save ₹{savings}</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-400">(inclusive of all taxes)</span>

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
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg hover:bg-gray-100 transition-colors border-none" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="text-base font-bold min-w-[32px] text-center">{qty}</span>
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg hover:bg-gray-100 transition-colors border-none" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              className={`flex-1 py-3 rounded-xl text-white text-base font-bold border-none cursor-pointer transition-colors ${added ? "bg-[#23918c]" : "bg-[#2AA7A1] hover:bg-[#23918c]"} disabled:opacity-50`}
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {added ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
            <button
              className={`px-4 py-3 rounded-xl border cursor-pointer flex items-center gap-1.5 text-sm transition-colors hover:bg-gray-50 ${wished ? "text-red-500 border-red-200 bg-red-50" : "text-gray-400 border-gray-200 bg-transparent"}`}
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

          <p className="text-sm leading-relaxed text-gray-500">{product.description}</p>

          {product.tags && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-brand-light text-brand text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
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
```

---

## STEP 24 — Fix `routes/AppRoutes.jsx`

No change needed — it already works. Just make sure imports match.

---

## STEP 25 — Update `components/common/Footer.jsx`

Change the phone number from US to India format:

Find this line:
```
<p>+1-234-567-890</p>
```
Replace with:
```
<p>+91 98765 43210</p>
```

The rest of the Footer is already good — it uses MediHAA branding.

---

## STEP 26 — Delete / clean up unused files

These files in vm_src_dump are now unused or replaced:

- `components/common/Button.jsx` — empty, delete it
- `components/common/Searchbar.jsx` — search is now in Navbar, delete it
- `data/product.js` — renamed to `products.js` in Step 6, delete the old one
- `hooks/useLocalStorage.js` — was empty, now filled in Step 5

---

## FINAL CHECKLIST

Go through each file and confirm:

- [ ] Step 1: `index.css` updated with `@tailwind base/components/utilities` + `page-container`
- [ ] Step 2: `tailwind.config.js` has `brand`, `brand-dark`, `shadow-card` etc.
- [ ] Step 3: `App.jsx` wraps everything including `BrowserRouter` + `CartProvider`
- [ ] Step 4: `main.jsx` simplified (no BrowserRouter/CartProvider)
- [ ] Step 5: `hooks/useLocalStorage.js` created
- [ ] Step 6: `data/products.js` created with Indian products + `CATEGORIES` + `COUPONS`
- [ ] Step 7: `utils/pricing.js` updated (named exports, no `import React`)
- [ ] Step 8: `utils/filters.js` accepts single `filters` object
- [ ] Step 9: `context/CartContext.jsx` upgraded (useLocalStorage, wishlist, multi-coupon)
- [ ] Step 10: `hooks/useCart.js` updated (default export, includes pricing)
- [ ] Step 11: `components/common/Loader.jsx` created
- [ ] Step 12: `Navbar.jsx` — functional search, cart badge, mobile menu kept
- [ ] Step 13: `CartItem.jsx` — ₹, better UI
- [ ] Step 14: `CartSummary.jsx` — ₹, `children` prop for checkout button
- [ ] Step 15: `CouponBox.jsx` — multi-coupon support
- [ ] Step 16: `OrderSummary.jsx` — actual component (was just comments)
- [ ] Step 17: `ProductCard.jsx` — wishlist, discount %, feedback state
- [ ] Step 18: `ProductFilters.jsx` — sidebar, unified filters object, ₹ range
- [ ] Step 19: `ProductGrid.jsx` — empty state added
- [ ] Step 20: `Home.jsx` — hero, URL-based search, unified filters
- [ ] Step 21: `Cart.jsx` — polished layout, clear cart button
- [ ] Step 22: `Checkout.jsx` — full form, Indian payment methods, ₹
- [ ] Step 23: `ProductDetails.jsx` — qty selector, wishlist, related products, ₹
- [ ] Step 25: `Footer.jsx` — phone number updated to India format
- [ ] Step 26: Deleted unused files (`Button.jsx`, `Searchbar.jsx`, old `product.js`)

---

*MediHAA — Your trusted Indian health partner 🏥*

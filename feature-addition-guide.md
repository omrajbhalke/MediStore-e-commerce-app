# Feature Addition Guide
## Auth (Login/Signup) + Favourites Page + Profile Dropdown + Per-User Storage

---

## What we're building

| Feature | Details |
|---|---|
| Auth pages | `/login` and `/signup` — stored in localStorage |
| Per-user storage | Cart and wishlist keys are namespaced by user email |
| Favourites page | `/favourites` — shows wishlist items with remove button |
| Profile avatar in Navbar | Dropdown with "Favourites" and "Profile" links |
| Profile page | `/profile` — shows name, email, logout button |
| Protected routes | Cart, Checkout, Favourites, Profile require login |

---

## Overview of new files and changed files

**New files to create:**
- `context/AuthContext.jsx`
- `hooks/useAuth.js`
- `pages/Login.jsx`
- `pages/Signup.jsx`
- `pages/Favourites.jsx`
- `pages/Profile.jsx`
- `components/common/ProtectedRoute.jsx`

**Files to modify:**
- `context/CartContext.jsx` — namespace storage keys by user
- `hooks/useCart.js` — no change needed
- `components/common/Navbar.jsx` — add avatar + dropdown
- `routes/AppRoutes.jsx` — add new routes + protect existing ones
- `App.jsx` — wrap with AuthProvider

---

## STEP 1 — `context/AuthContext.jsx` (NEW FILE)

This handles everything: signup, login, logout, and current user state.

```jsx
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const USERS_KEY = "medistore-users";   // list of all registered users
const SESSION_KEY = "medistore-session"; // currently logged-in user email

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getSession());

  const signup = useCallback(({ name, email, password }) => {
    const users = getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, error: "An account with this email already exists." };

    const newUser = { name, email: email.toLowerCase(), password };
    saveUsers([...users, newUser]);

    // Auto-login after signup
    const session = { name, email: email.toLowerCase() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setCurrentUser(session);
    return { success: true };
  }, []);

  const login = useCallback(({ email, password }) => {
    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { success: false, error: "Invalid email or password." };

    const session = { name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setCurrentUser(session);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
```

---

## STEP 2 — `hooks/useAuth.js` (NEW FILE)

A simple hook so components can just import `useAuth`.

```js
import { useAuthContext } from "../context/AuthContext";

export function useAuth() {
  return useAuthContext();
}
```

---

## STEP 3 — `context/CartContext.jsx` (MODIFY — per-user storage keys)

The only change here is making the localStorage keys include the user's email, so each user gets their own cart and wishlist. Replace the entire file:

```jsx
import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { COUPONS } from "../data/products";

const CartContext = createContext(null);

// ─── per-user localStorage helper ────────────────────────────────────────────
function useUserStorage(key, initialValue, userEmail) {
  // Full key: "medistore-cart:user@example.com" or fallback to "medistore-cart:guest"
  const storageKey = `${key}:${userEmail || "guest"}`;

  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // When user changes (login/logout), re-read from storage for the new key
  useEffect(() => {
    try {
      const item = localStorage.getItem(storageKey);
      setValue(item ? JSON.parse(item) : initialValue);
    } catch {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  }, [storageKey, value]);

  return [value, setValue];
}
// ─────────────────────────────────────────────────────────────────────────────

export function CartProvider({ children, userEmail }) {
  const [cartItems, setCartItems] = useUserStorage("medistore-cart", [], userEmail);
  const [appliedCoupon, setAppliedCoupon] = useUserStorage("medistore-coupon", null, userEmail);
  const [wishlist, setWishlist] = useUserStorage("medistore-wishlist", [], userEmail);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((i) => i.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
  }, [setCartItems]);

  const removeFromCart = useCallback((id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, [setCartItems]);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((i) => i.id !== id ? i : { ...i, quantity: Math.min(quantity, i.stock) })
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

  const removeCoupon = useCallback(() => setAppliedCoupon(null), [setAppliedCoupon]);

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

## STEP 4 — `App.jsx` (MODIFY — add AuthProvider, pass userEmail to CartProvider)

Replace the entire file:

```jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/common/Navbar";
import AppRoutes from "./routes/AppRoutes";

// Inner component so it can read AuthContext for the userEmail
function AppShell() {
  const { currentUser } = useAuthContext();
  return (
    <CartProvider userEmail={currentUser?.email}>
      <Navbar />
      <AppRoutes />
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

> Why the `AppShell` split? `CartProvider` needs `userEmail` from `AuthContext`, but you can't call a context hook in the same component that renders its Provider. The inner component solves this cleanly.

---

## STEP 5 — `components/common/ProtectedRoute.jsx` (NEW FILE)

Redirects unauthenticated users to `/login`.

```jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Save where they were going so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

---

## STEP 6 — `pages/Login.jsx` (NEW FILE)

```jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect away
  if (currentUser) {
    navigate(from, { replace: true });
    return null;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const result = login({ email: form.email.trim(), password: form.password });
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-[68px]">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center text-white text-lg font-bold">M</div>
          <span className="font-display text-[22px] text-brand tracking-tight">MEDISTORE</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-400 mb-6">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800 outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800 outline-none focus:border-brand transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-white font-semibold rounded-xl border-none cursor-pointer hover:bg-brand-dark transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-brand font-semibold">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}
```

---

## STEP 7 — `pages/Signup.jsx` (NEW FILE)

```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Signup() {
  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (currentUser) {
    navigate("/", { replace: true });
    return null;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email is required.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    const result = signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
    setLoading(false);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setErrors({ email: result.error });
    }
  }

  function Field({ name, label, type = "text", placeholder }) {
    return (
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
        <input
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 text-gray-800 outline-none focus:border-brand transition-colors ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        />
        {errors[name] && <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-[68px]">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center text-white text-lg font-bold">M</div>
          <span className="font-display text-[22px] text-brand tracking-tight">MEDISTORE</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Create an account</h1>
        <p className="text-sm text-gray-400 mb-6">Join MEDISTORE to track your orders and wishlist</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field name="name" label="Full Name" placeholder="John Doe" />
          <Field name="email" label="Email" type="email" placeholder="john@example.com" />
          <Field name="password" label="Password" type="password" placeholder="Min. 6 characters" />
          <Field name="confirm" label="Confirm Password" type="password" placeholder="Repeat your password" />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-white font-semibold rounded-xl border-none cursor-pointer hover:bg-brand-dark transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand font-semibold">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
```

---

## STEP 8 — `pages/Favourites.jsx` (NEW FILE)

```jsx
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export default function Favourites() {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="page-container">
        <h1 className="font-display text-[28px] font-normal text-gray-800 mb-1">Favourites</h1>
        <p className="text-sm text-gray-400 mb-10">Items you've saved for later</p>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200 mb-4">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-2">No favourites yet</p>
          <p className="text-sm text-gray-400 mb-6">Tap the heart icon on any product to save it here.</p>
          <Link
            to="/"
            className="px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg no-underline hover:bg-brand-dark transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="font-display text-[28px] font-normal text-gray-800 mb-1">Favourites</h1>
      <p className="text-sm text-gray-400 mb-8">{wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}</p>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {wishlist.map((product) => {
          const discount = product.originalPrice
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : 0;

          return (
            <div key={product.id} className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col relative">

              {/* Discount badge */}
              {discount > 0 && (
                <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10">
                  -{discount}%
                </span>
              )}

              {/* Remove from favourites */}
              <button
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center cursor-pointer border-none shadow-sm transition-colors hover:bg-red-100"
                onClick={() => toggleWishlist(product)}
                title="Remove from favourites"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>

              <Link to={`/products/${product.id}`} className="no-underline">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-44 object-cover bg-slate-50"
                />
              </Link>

              <div className="p-4 flex flex-col gap-1.5 flex-1">
                <span className="text-[11px] text-brand font-semibold uppercase tracking-wide">{product.category}</span>
                <Link to={`/products/${product.id}`} className="no-underline">
                  <div className="text-sm font-semibold leading-snug text-gray-800 hover:text-brand transition-colors">
                    {product.name}
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 mt-auto pt-1">
                  <span className="text-base font-bold text-brand">${product.price.toFixed(2)}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                <button
                  className="w-full mt-2 py-2 bg-brand text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-brand-dark transition-colors"
                  onClick={() => addToCart(product, 1)}
                >
                  Add to Cart
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## STEP 9 — `pages/Profile.jsx` (NEW FILE)

```jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { cartCount, wishlist } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Get user initials for avatar
  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="page-container max-w-2xl">

      <h1 className="font-display text-[28px] font-normal text-gray-800 mb-8">My Profile</h1>

      {/* Avatar + name card */}
      <div className="bg-white rounded-2xl shadow-card p-8 flex items-center gap-6 mb-5">
        <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-800">{currentUser?.name}</div>
          <div className="text-sm text-gray-400 mt-0.5">{currentUser?.email}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-card p-5 text-center">
          <div className="text-3xl font-bold text-brand mb-1">{cartCount}</div>
          <div className="text-sm text-gray-400">Items in Cart</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 text-center">
          <div className="text-3xl font-bold text-brand mb-1">{wishlist.length}</div>
          <div className="text-sm text-gray-400">Favourites Saved</div>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-5">
        <div className="text-base font-bold text-gray-800 mb-4">Account Details</div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Full Name</span>
            <span className="text-sm font-medium text-gray-800">{currentUser?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-800">{currentUser?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Account Type</span>
            <span className="text-sm font-medium text-gray-800">Standard</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
      >
        Sign Out
      </button>

    </div>
  );
}
```

---

## STEP 10 — `components/common/Navbar.jsx` (MODIFY — add avatar + dropdown)

Replace the entire file:

```jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { cartCount, wishlist } = useCart();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(q) {
    navigate(`/?search=${encodeURIComponent(q)}`);
  }

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  }

  // Get user initials
  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto h-full flex items-center gap-5 px-5">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
          <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center text-white text-lg font-bold">
            M
          </div>
          <span className="font-display text-[22px] text-brand tracking-tight">
            MEDISTORE
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <SearchBar
            value={search}
            onChange={setSearch}
            onSearch={handleSearch}
            placeholder="Search medicines, supplements…"
          />
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">

          {/* Cart button */}
          <Link to="/cart" className="relative no-underline">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors cursor-pointer border-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>

          {/* Profile avatar / Login button */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center cursor-pointer border-none hover:bg-brand-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                title={currentUser.name}
              >
                {initials}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-card-lg border border-gray-100 py-2 z-50 animate-fade-up">

                  {/* User info */}
                  <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                    <div className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</div>
                    <div className="text-xs text-gray-400 truncate">{currentUser.email}</div>
                  </div>

                  {/* Favourites */}
                  <Link
                    to="/favourites"
                    className="no-underline"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      Favourites
                      {wishlist.length > 0 && (
                        <span className="ml-auto bg-red-100 text-red-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                          {wishlist.length}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Profile */}
                  <Link
                    to="/profile"
                    className="no-underline"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Profile
                    </div>
                  </Link>

                  {/* Divider + Logout */}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer bg-transparent border-none transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="no-underline">
              <button className="px-4 py-2 text-brand border border-brand text-sm font-semibold rounded-lg hover:bg-brand-light transition-colors cursor-pointer bg-transparent">
                Sign In
              </button>
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}
```

---

## STEP 11 — `routes/AppRoutes.jsx` (MODIFY — add new routes + protect existing)

Replace the entire file:

```jsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Favourites from "../pages/Favourites";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/common/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — anyone can access */}
      <Route path="/" element={<Home />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — must be logged in */}
      <Route path="/cart" element={
        <ProtectedRoute><Cart /></ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute><Checkout /></ProtectedRoute>
      } />
      <Route path="/favourites" element={
        <ProtectedRoute><Favourites /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
    </Routes>
  );
}
```

---

## How everything connects — quick mental map

```
localStorage
├── medistore-users          → array of { name, email, password }
├── medistore-session        → { name, email } of logged-in user
│
├── medistore-cart:alice@x.com     → Alice's cart
├── medistore-wishlist:alice@x.com → Alice's wishlist
├── medistore-coupon:alice@x.com   → Alice's coupon
│
├── medistore-cart:bob@x.com       → Bob's cart (separate!)
└── medistore-wishlist:bob@x.com   → Bob's wishlist (separate!)
```

When a user logs in, `userEmail` flows from `AuthContext` → `App.jsx (AppShell)` → `CartProvider` → all storage keys update automatically. When they log out, `userEmail` becomes `undefined` so keys fall back to the `:guest` namespace.

---

## Summary checklist

| # | File | Action |
|---|---|---|
| 1 | `context/AuthContext.jsx` | Create new |
| 2 | `hooks/useAuth.js` | Create new |
| 3 | `context/CartContext.jsx` | Modify — per-user storage keys |
| 4 | `App.jsx` | Modify — add AuthProvider + AppShell pattern |
| 5 | `components/common/ProtectedRoute.jsx` | Create new |
| 6 | `pages/Login.jsx` | Create new |
| 7 | `pages/Signup.jsx` | Create new |
| 8 | `pages/Favourites.jsx` | Create new |
| 9 | `pages/Profile.jsx` | Create new |
| 10 | `components/common/Navbar.jsx` | Modify — add avatar + dropdown |
| 11 | `routes/AppRoutes.jsx` | Modify — add routes + protect existing |

**Recommended order:** Do steps 1 → 2 → 3 → 4 first (the auth + storage foundation), then 5 → 11 (the UI pieces). This way the app stays runnable at every step.

---

## Quick test after you're done

1. Go to `/` — you should see the "Sign In" button in navbar (not a profile circle).
2. Click Cart — should redirect to `/login`.
3. Sign up with a new account — auto-login, redirects to `/`.
4. Add products to cart and wishlist.
5. Log out → log in with a different account → cart and wishlist should be empty (different user).
6. Log back in with the first account → your cart and wishlist are back.
7. Click the profile circle → dropdown shows Favourites and Profile.
8. Go to `/favourites` — see your saved items, can remove or add to cart from there.

# MediHAA — Phase 2 Guide
### Auth (Login/Signup) + Favourites Page + Profile Dropdown + Per-User Storage

---

## WHAT WE ARE BUILDING

| Feature | Details |
|---|---|
| `context/AuthContext.jsx` | NEW — manages current user, login, signup, logout. All users stored in localStorage |
| `pages/Login.jsx` | NEW — login form |
| `pages/Signup.jsx` | NEW — signup form |
| `pages/Favourites.jsx` | NEW — shows the wishlist as a "My Favourites" page |
| `pages/Profile.jsx` | NEW — shows logged-in user's name, email, joined date |
| `context/CartContext.jsx` | MODIFY — keys now scoped per user (e.g. `medihaa-cart-user@email.com`) |
| `components/common/Navbar.jsx` | MODIFY — add profile avatar with dropdown (Favourites + Profile) |
| `routes/AppRoutes.jsx` | MODIFY — add 4 new routes |
| `hooks/useAuth.js` | NEW — convenience hook for auth context |

### How Per-User Storage Works
Instead of storing cart and wishlist under a fixed key like `medihaa-cart`, we scope it by the logged-in user's email:
- `medihaa-cart-rahul@gmail.com`
- `medihaa-wishlist-rahul@gmail.com`

When a different user logs in, they get their own empty cart and wishlist. When they log out, the Navbar shows a login button instead of a profile avatar.

---

## UPDATED FOLDER STRUCTURE

```
src/
├── context/
│   ├── AuthContext.jsx        ← NEW
│   └── CartContext.jsx        ← MODIFY (per-user keys)
├── hooks/
│   ├── useAuth.js             ← NEW
│   ├── useCart.js
│   └── useLocalStorage.js
├── pages/
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── Favourites.jsx         ← NEW
│   ├── Home.jsx
│   ├── Login.jsx              ← NEW
│   ├── ProductDetails.jsx
│   ├── Profile.jsx            ← NEW
│   └── Signup.jsx             ← NEW
├── components/common/
│   └── Navbar.jsx             ← MODIFY
└── routes/
    └── AppRoutes.jsx          ← MODIFY
```

---

## STEP 1 — Create `context/AuthContext.jsx`

This is the heart of the whole feature. It manages:
- A `users` array in localStorage (all registered accounts)
- A `currentUser` in localStorage (who is currently logged in)
- `login()`, `signup()`, `logout()` functions

Create a **new file**: `src/context/AuthContext.jsx`

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Helper: read/write all users from localStorage
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("medihaa-users") || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem("medihaa-users", JSON.stringify(users));
}

function getStoredCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("medihaa-current-user") || "null");
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredCurrentUser());

  // SIGNUP — creates a new account
  function signup({ name, email, password }) {
    const users = getUsers();

    // Check if email already exists
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // In real apps NEVER store plain password. This is localStorage-only mock.
      joinedAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);

    // Auto-login after signup
    const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, joinedAt: newUser.joinedAt };
    localStorage.setItem("medihaa-current-user", JSON.stringify(safeUser));
    setCurrentUser(safeUser);

    return { success: true };
  }

  // LOGIN — checks credentials
  function login({ email, password }) {
    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, joinedAt: user.joinedAt };
    localStorage.setItem("medihaa-current-user", JSON.stringify(safeUser));
    setCurrentUser(safeUser);

    return { success: true };
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem("medihaa-current-user");
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout }}>
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

## STEP 2 — Create `hooks/useAuth.js`

A simple convenience hook, consistent with how `useCart` works.

Create a **new file**: `src/hooks/useAuth.js`

```js
// src/hooks/useAuth.js
import { useAuthContext } from "../context/AuthContext";

export default function useAuth() {
  return useAuthContext();
}
```

---

## STEP 3 — Update `App.jsx`

Wrap everything in `AuthProvider`. It must go **outside** `CartProvider` because CartContext will need to read the current user.

**Replace your entire `App.jsx`** with:

```jsx
// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import CartProvider from "./context/CartContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <AppRoutes />
          <Footer />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## STEP 4 — Update `context/CartContext.jsx`

The only change here is making the localStorage keys **user-scoped**. When no user is logged in, we fall back to a guest key so the app still works without login.

**Replace your entire `context/CartContext.jsx`** with:

```jsx
// src/context/CartContext.jsx
import { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { COUPONS } from "../data/products";
import { useAuthContext } from "./AuthContext";

const CartContext = createContext(null);

export default function CartProvider({ children }) {
  // Get current user to scope storage keys
  const { currentUser } = useAuthContext();
  const userKey = currentUser ? currentUser.email : "guest";

  // All keys are now scoped per user
  const [cartItems, setCartItems] = useLocalStorage(`medihaa-cart-${userKey}`, []);
  const [appliedCoupon, setAppliedCoupon] = useLocalStorage(`medihaa-coupon-${userKey}`, null);
  const [wishlist, setWishlist] = useLocalStorage(`medihaa-wishlist-${userKey}`, []);

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

## STEP 5 — Create `pages/Signup.jsx`

Create a **new file**: `src/pages/Signup.jsx`

```jsx
// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import logo from "../assets/logo.svg";

export default function Signup() {
  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // If already logged in, go home
  if (currentUser) {
    navigate("/");
    return null;
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = signup({ name: form.name, email: form.email, password: form.password });
    if (result.success) {
      navigate("/");
    } else {
      setServerError(result.error);
    }
  }

  function field(name, label, type = "text", placeholder = "") {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
        <input
          type={type}
          value={form[name]}
          onChange={(e) => {
            setForm({ ...form, [name]: e.target.value });
            setErrors({ ...errors, [name]: "" });
            setServerError("");
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-[#F5FAFF] text-gray-800 outline-none transition-colors focus:border-[#2AA7A1] ${errors[name] ? "border-red-400" : "border-[#6B8A9B]/50"}`}
        />
        {errors[name] && <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img src={logo} alt="MediHAA" className="h-14 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-6">Join MediHAA — your trusted health partner</p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {field("name", "Full Name", "text", "Rahul Sharma")}
            {field("email", "Email Address", "email", "rahul@example.com")}
            {field("password", "Password", "password", "Min 6 characters")}
            {field("confirm", "Confirm Password", "password", "Repeat your password")}

            <button
              type="submit"
              className="w-full py-3 bg-[#2AA7A1] text-white font-bold rounded-lg hover:bg-[#23918c] transition-colors border-none cursor-pointer mt-2"
            >
              Create Account
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-[#2AA7A1] font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
```

---

## STEP 6 — Create `pages/Login.jsx`

Create a **new file**: `src/pages/Login.jsx`

```jsx
// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import logo from "../assets/logo.svg";

export default function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // If already logged in, go home
  if (currentUser) {
    navigate("/");
    return null;
  }

  function validate() {
    const e = {};
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.password) e.password = "Password is required";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = login({ email: form.email, password: form.password });
    if (result.success) {
      navigate("/");
    } else {
      setServerError(result.error);
    }
  }

  function field(name, label, type = "text", placeholder = "") {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
        <input
          type={type}
          value={form[name]}
          onChange={(e) => {
            setForm({ ...form, [name]: e.target.value });
            setErrors({ ...errors, [name]: "" });
            setServerError("");
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-[#F5FAFF] text-gray-800 outline-none transition-colors focus:border-[#2AA7A1] ${errors[name] ? "border-red-400" : "border-[#6B8A9B]/50"}`}
        />
        {errors[name] && <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img src={logo} alt="MediHAA" className="h-14 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-6">Log in to your MediHAA account</p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {field("email", "Email Address", "email", "rahul@example.com")}
            {field("password", "Password", "password", "Your password")}

            <button
              type="submit"
              className="w-full py-3 bg-[#2AA7A1] text-white font-bold rounded-lg hover:bg-[#23918c] transition-colors border-none cursor-pointer mt-2"
            >
              Log In
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#2AA7A1] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
```

---

## STEP 7 — Create `pages/Favourites.jsx`

This is the "My Favourites" page — shows the wishlist with a remove button and add-to-cart option.

Create a **new file**: `src/pages/Favourites.jsx`

```jsx
// src/pages/Favourites.jsx
import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? "#ef4444" : "none"}
      stroke={filled ? "#ef4444" : "#9ca3af"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

export default function Favourites() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { currentUser } = useAuth();

  // Not logged in
  if (!currentUser) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HeartIcon filled={false} />
          <p className="text-lg font-semibold text-gray-700 mt-4 mb-2">Please log in to see your Favourites</p>
          <p className="text-sm text-gray-400 mb-6">Your saved items will appear here after you log in.</p>
          <Link to="/login" className="px-6 py-2.5 bg-[#2AA7A1] text-white text-sm font-semibold rounded-lg no-underline hover:bg-[#23918c] transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Empty wishlist
  if (wishlist.length === 0) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-gray-200 mb-4">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-2">No favourites yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Tap the ♡ heart on any product to save it here.
          </p>
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
        <h1 className="text-[28px] font-bold text-gray-800 mb-1">My Favourites</h1>
        <p className="text-sm text-gray-400">{wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {wishlist.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col">

            {/* Image */}
            <Link to={`/products/${product.id}`} className="block relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-44 object-cover bg-slate-50"
              />
              {/* Remove from favourites */}
              <button
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center cursor-pointer border-none shadow-sm hover:bg-red-100 transition-colors"
                onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                title="Remove from Favourites"
              >
                <HeartIcon filled={true} />
              </button>
            </Link>

            {/* Info */}
            <div className="p-4 flex flex-col gap-2 flex-1">
              <span className="text-[11px] text-[#2AA7A1] font-semibold uppercase tracking-wide">{product.category}</span>
              <Link to={`/products/${product.id}`} className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 no-underline hover:text-[#2AA7A1] transition-colors">
                {product.name}
              </Link>
              <div className="flex items-center gap-2 mt-auto pt-1">
                <span className="text-base font-bold text-[#2AA7A1]">₹{product.price.toFixed(2)}</span>
                {product.originalPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toFixed(2)}</span>
                )}
              </div>
              <button
                className="w-full py-2 bg-[#2AA7A1] text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-[#23918c] transition-colors mt-1"
                onClick={() => addToCart(product, 1)}
              >
                Add to Cart
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## STEP 8 — Create `pages/Profile.jsx`

Shows the logged-in user's info. Simple and clean.

Create a **new file**: `src/pages/Profile.jsx`

```jsx
// src/pages/Profile.jsx
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { wishlist, cartItems } = useCart();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-400 mb-4">You are not logged in.</p>
        <Link to="/login" className="text-[#2AA7A1] font-semibold">Go to Login →</Link>
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  // Get initials for avatar
  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = new Date(currentUser.joinedAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="page-container max-w-2xl">

      <h1 className="text-[28px] font-bold text-gray-800 mb-6">My Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-card p-8 mb-5">
        <div className="flex items-center gap-5 mb-6">
          {/* Avatar circle with initials */}
          <div className="w-16 h-16 rounded-full bg-[#2AA7A1] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{currentUser.name}</div>
            <div className="text-sm text-gray-400">{currentUser.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#2AA7A1]">{wishlist.length}</div>
            <div className="text-xs text-gray-400 mt-1">Favourites</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-2xl font-bold text-[#2AA7A1]">{cartItems.length}</div>
            <div className="text-xs text-gray-400 mt-1">In Cart</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-700">{joinedDate}</div>
            <div className="text-xs text-gray-400 mt-1">Member Since</div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl shadow-card p-8 mb-5">
        <h2 className="text-base font-bold text-gray-800 mb-4">Account Details</h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Full Name</span>
            <span className="text-sm font-semibold text-gray-800">{currentUser.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-semibold text-gray-800">{currentUser.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Account ID</span>
            <span className="text-sm font-mono text-gray-400">{currentUser.id}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-card p-8 mb-5">
        <h2 className="text-base font-bold text-gray-800 mb-4">Quick Links</h2>
        <div className="flex flex-col gap-2">
          <Link
            to="/favourites"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F5FAFF] transition-colors no-underline text-gray-700 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2AA7A1" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            My Favourites ({wishlist.length})
          </Link>
          <Link
            to="/cart"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F5FAFF] transition-colors no-underline text-gray-700 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2AA7A1" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            My Cart ({cartItems.length} items)
          </Link>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 border-2 border-red-200 text-red-500 font-semibold rounded-xl bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
      >
        Log Out
      </button>

    </div>
  );
}
```

---

## STEP 9 — Update `components/common/Navbar.jsx`

This is the biggest UI change. We add:
- A **profile avatar** (circle with user's initials) when logged in
- A **dropdown** on avatar click with "My Favourites" and "My Profile" links
- A **Login button** when not logged in
- Close dropdown when clicking outside

**Replace your entire `Navbar.jsx`** with:

```jsx
// src/components/common/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import useCart from "../../hooks/useCart";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
  const { cartCount, wishlist } = useCart();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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

  function handleSearch(e) {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setMenuOpen(false);
    }
  }

  // Get initials from user name
  function getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    navigate("/");
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

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">

          {/* Cart */}
          <div className="relative">
            <Link to="/cart">
              <button className="flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-md bg-[#2AA7A1] hover:bg-[#23918c] cursor-pointer transition-colors border-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Cart
              </button>
            </Link>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 pointer-events-none">
                {cartCount}
              </span>
            )}
          </div>

          {/* Profile OR Login */}
          {currentUser ? (
            // PROFILE AVATAR + DROPDOWN
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-[#2AA7A1] text-white text-sm font-bold flex items-center justify-center cursor-pointer border-none hover:bg-[#23918c] transition-colors focus:outline-none"
                title={currentUser.name}
              >
                {getInitials(currentUser.name)}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-xl shadow-card-lg border border-gray-100 py-2 z-50">

                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</div>
                    <div className="text-xs text-gray-400 truncate">{currentUser.email}</div>
                  </div>

                  {/* Menu items */}
                  <Link
                    to="/favourites"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5FAFF] transition-colors no-underline"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2AA7A1" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    My Favourites
                    {wishlist.length > 0 && (
                      <span className="ml-auto bg-red-100 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5FAFF] transition-colors no-underline"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2AA7A1" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </Link>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors bg-transparent border-none cursor-pointer text-left"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Log Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            // LOGIN BUTTON (not logged in)
            <Link to="/login">
              <button className="flex items-center gap-2 text-[#2AA7A1] text-sm font-semibold px-3 py-2 rounded-md border border-[#2AA7A1] bg-transparent hover:bg-[#2AA7A1] hover:text-white cursor-pointer transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </button>
            </Link>
          )}

        </div>

        {/* Hamburger (mobile) */}
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
          {/* Mobile search */}
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

          {/* Mobile cart */}
          <Link to="/cart" onClick={() => setMenuOpen(false)}>
            <button className="flex items-center justify-center gap-2 bg-[#2AA7A1] text-white text-sm font-medium px-5 py-2.5 rounded-full w-full border-none cursor-pointer">
              Cart {cartCount > 0 && `(${cartCount})`}
            </button>
          </Link>

          {/* Mobile: logged in links */}
          {currentUser ? (
            <>
              <Link to="/favourites" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 text-center py-2 no-underline hover:text-[#2AA7A1]">
                ♡ My Favourites {wishlist.length > 0 && `(${wishlist.length})`}
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 text-center py-2 no-underline hover:text-[#2AA7A1]">
                My Profile
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="text-sm text-red-500 text-center py-2 bg-transparent border-none cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm text-[#2AA7A1] text-center font-semibold py-2 no-underline">
              Log In / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
```

---

## STEP 10 — Update `routes/AppRoutes.jsx`

Add routes for Login, Signup, Favourites, and Profile.

**Replace your entire `AppRoutes.jsx`** with:

```jsx
// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Favourites from "../pages/Favourites";
import Profile from "../pages/Profile";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/favourites" element={<Favourites />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
};

export default AppRoutes;
```

---

## STEP 11 — Small tweak to `tailwind.config.js`

Make sure `shadow-card-lg` is defined (used by the dropdown). If you already have this from the previous guide, you're done. If not, add it:

In `tailwind.config.js`, inside `theme.extend.boxShadow`, ensure this exists:

```js
"card-lg": "0 10px 25px rgba(0,0,0,0.12)",
```

---

## FINAL CHECKLIST

Go through each file and confirm it's done:

- [ ] Step 1: `src/context/AuthContext.jsx` — **CREATED**
- [ ] Step 2: `src/hooks/useAuth.js` — **CREATED**
- [ ] Step 3: `src/App.jsx` — **UPDATED** (added `<AuthProvider>` wrapping everything)
- [ ] Step 4: `src/context/CartContext.jsx` — **UPDATED** (user-scoped keys, imports `useAuthContext`)
- [ ] Step 5: `src/pages/Signup.jsx` — **CREATED**
- [ ] Step 6: `src/pages/Login.jsx` — **CREATED**
- [ ] Step 7: `src/pages/Favourites.jsx` — **CREATED**
- [ ] Step 8: `src/pages/Profile.jsx` — **CREATED**
- [ ] Step 9: `src/components/common/Navbar.jsx` — **UPDATED** (profile avatar, dropdown, login button)
- [ ] Step 10: `src/routes/AppRoutes.jsx` — **UPDATED** (4 new routes)
- [ ] Step 11: `tailwind.config.js` — confirm `shadow-card-lg` exists

---

## HOW IT ALL WORKS TOGETHER

```
User visits site
│
├─ NOT logged in
│   ├─ Navbar shows: [Cart] [Login button]
│   ├─ /favourites → "Please log in" message
│   ├─ /profile → "Not logged in" message
│   └─ Cart & wishlist stored under key: medihaa-cart-guest
│
└─ LOGGED IN (e.g. rahul@gmail.com)
    ├─ Navbar shows: [Cart] [RA avatar → dropdown]
    ├─ Dropdown: My Favourites | My Profile | Log Out
    ├─ /favourites → shows their personal wishlist
    ├─ /profile → shows name, email, joined date, stats
    └─ Cart & wishlist stored under: medihaa-cart-rahul@gmail.com
                                     medihaa-wishlist-rahul@gmail.com

Different user logs in (e.g. priya@gmail.com)
    └─ Gets their own: medihaa-cart-priya@gmail.com (empty or their own items)
       rahul's cart is untouched in localStorage, just not shown
```

---

## TESTING CHECKLIST

After you implement, test these scenarios:

1. **Sign up** with a new email → should redirect to home, avatar appears in Navbar
2. **Log out** → avatar disappears, Login button appears
3. **Log in** with same credentials → avatar appears again, cart/wishlist from before is restored
4. **Add to cart / wishlist** → log out → log in as a different user → cart should be empty
5. **Log back in as first user** → cart and wishlist should be exactly as you left them
6. **Visit /favourites** while not logged in → should show the login prompt
7. **Click avatar** → dropdown opens with Favourites + Profile links
8. **Click outside dropdown** → it closes automatically
9. **Try signing up with same email twice** → should show error message
10. **Try logging in with wrong password** → should show error message

---

*MediHAA Phase 2 — Auth + Favourites + Profile 🏥*

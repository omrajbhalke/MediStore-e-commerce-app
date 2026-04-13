# 🏥 MediStore — Mini E-Commerce App (Tailwind CSS)

A fully-featured mini e-commerce site for medicines and health products, built with **Vite + React + Tailwind CSS v3**.

## 🚀 Quick Start

```bash
# 1. Install dependencies (includes Tailwind, PostCSS, Autoprefixer)
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

## 🎨 Tailwind Setup

Three config files power the styling:

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Custom colors (`brand`, `accent`), fonts, shadows, keyframes |
| `postcss.config.js` | Runs Tailwind + Autoprefixer through Vite |
| `src/index.css` | `@tailwind` directives + minimal globals |

### Custom design tokens (tailwind.config.js)
```js
colors: {
  brand: { DEFAULT: "#0d9e6e", dark: "#087a54", light: "#e6f7f2" },
  accent: "#f59e0b",
}
// Used as: bg-brand, text-brand, hover:bg-brand-dark, bg-brand-light ...
```

## 🏗️ Project Structure

```
src/
├── data/products.js          # 12 products + coupon codes
├── components/
│   ├── common/  Navbar, SearchBar, Loader
│   ├── product/ ProductCard, ProductGrid, ProductFilters
│   ├── cart/    CartItem, CartSummary, CouponBox
│   └── checkout/ OrderSummary
├── pages/       Home, ProductDetails, Cart, Checkout
├── context/     CartContext.jsx
├── hooks/       useCart.js, useLocalStorage.js
├── utils/       pricing.js, filters.js
└── routes/      AppRoutes.jsx
```

## 🔖 Coupon Codes

| Code | Discount |
|------|----------|
| `SAVE10` | 10% off |
| `MEDI5` | $5 flat off |
| `HEALTH20` | 20% off |

## 📦 Tech Stack

- **React 18** · **Vite 5** · **React Router v6**
- **Tailwind CSS v3** for all styling
- **Context API** + **localStorage** for state & persistence

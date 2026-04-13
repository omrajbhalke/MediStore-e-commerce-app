import { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { COUPONS } from "../data/products";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useLocalStorage("medistore-cart", []);
  const [appliedCoupon, setAppliedCoupon] = useLocalStorage("medistore-coupon", null);
  const [wishlist, setWishlist] = useLocalStorage("medistore-wishlist", []);

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
      prev.map((i) => {
        if (i.id !== id) return i;
        return { ...i, quantity: Math.min(quantity, i.stock) };
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
      cartItems,
      appliedCoupon,
      wishlist,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
      toggleWishlist,
      isInWishlist,
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

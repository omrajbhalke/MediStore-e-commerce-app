import { useCartContext } from "../context/CartContext";
import { calcSubtotal, calcTax, calcDiscount, calcTotal } from "../utils/pricing";

export function useCart() {
  const cart = useCartContext();

  const subtotal = calcSubtotal(cart.cartItems);
  const tax = calcTax(subtotal);
  const discount = calcDiscount(subtotal, cart.appliedCoupon);
  const total = calcTotal(subtotal, tax, discount);

  return {
    ...cart,
    subtotal,
    tax,
    discount,
    total,
  };
}

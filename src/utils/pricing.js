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

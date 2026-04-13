import { useCart } from "../../hooks/useCart";

export default function CartSummary({ children }) {
  const { subtotal, tax, discount, total, appliedCoupon } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-card p-6 sticky top-[92px]">
      <div className="text-base font-bold text-gray-800 mb-5">Cart Summary</div>

      <div className="flex justify-between items-center py-2 text-sm text-gray-500">
        <span>Subtotal</span>
        <span className="text-gray-800 font-medium">${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center py-2 text-sm text-gray-500">
        <span>Tax (5%)</span>
        <span className="text-gray-800 font-medium">${tax.toFixed(2)}</span>
      </div>
      {appliedCoupon && (
        <div className="flex justify-between items-center py-2 text-sm text-gray-500">
          <span>Discount ({appliedCoupon.code})</span>
          <span className="text-red-500 font-semibold">−${discount.toFixed(2)}</span>
        </div>
      )}

      <div className="h-px bg-gray-100 my-3" />

      <div className="flex justify-between items-center py-1 text-[17px] font-bold text-gray-800">
        <span>Grand Total</span>
        <span className="text-brand text-xl">${total.toFixed(2)}</span>
      </div>

      {children}
    </div>
  );
}

import { useCart } from "../../hooks/useCart";

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
          <span className="text-sm font-bold text-brand whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tax (5%)</span><span>${tax.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Discount ({appliedCoupon.code})</span>
            <span className="text-red-500 font-semibold">−${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="h-px bg-gray-100 my-2" />
        <div className="flex justify-between text-base font-bold text-gray-800">
          <span>Total to Pay</span>
          <span className="text-brand">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

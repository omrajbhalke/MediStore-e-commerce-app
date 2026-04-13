import { useState } from "react";
import { useCart } from "../../hooks/useCart";

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
          <button
            className="bg-transparent border-none cursor-pointer text-red-500 text-lg leading-none p-0.5 hover:text-red-700"
            onClick={removeCoupon}
            title="Remove coupon"
          >
            ×
          </button>
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
              className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-brand-dark transition-colors whitespace-nowrap"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
          {msg && (
            <p className={`text-xs mt-1.5 ${msg.type === "success" ? "text-brand" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">Try: SAVE10 · MEDI5 · HEALTH20</p>
        </>
      )}
    </div>
  );
}

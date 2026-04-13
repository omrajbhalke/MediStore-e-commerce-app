import { useCart } from "../../hooks/useCart";

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
          >
            −
          </button>
          <span className="text-sm font-semibold min-w-[22px] text-center">{item.quantity}</span>
          <button
            className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer text-brand font-bold text-lg leading-none hover:bg-gray-100 transition-colors disabled:opacity-40"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
          >
            +
          </button>
          {item.quantity >= item.stock && (
            <span className="text-[11px] text-red-500">Max stock</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className="text-[15px] font-bold text-brand">${(item.price * item.quantity).toFixed(2)}</span>
        <button
          className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
          onClick={() => removeFromCart(item.id)}
          title="Remove"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import CouponBox from "../components/cart/CouponBox";

export default function Cart() {
  const { cartItems, clearCart, cartCount } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200 mb-4">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</p>
          <p className="text-sm text-gray-400 mb-6">Add some products to get started!</p>
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

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-normal text-gray-800 mb-1">Shopping Cart</h1>
        <p className="text-sm text-gray-400">{cartCount} item{cartCount !== 1 ? "s" : ""} in your cart</p>
      </div>

      {/* Layout */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>

        {/* Cart items panel */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex justify-between items-center mb-1">
            <div className="text-base font-bold text-gray-800">Cart Items</div>
            <button
              className="text-red-400 hover:text-red-600 text-sm font-medium bg-transparent border-none cursor-pointer transition-colors"
              onClick={clearCart}
            >
              Clear cart
            </button>
          </div>
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Right column */}
        <div>
          <CartSummary>
            <Link
              to="/checkout"
              className="block w-full mt-4 py-3 bg-brand text-white text-center text-[15px] font-bold rounded-xl no-underline hover:bg-brand-dark transition-colors"
            >
              Proceed to Checkout →
            </Link>
          </CartSummary>
          <CouponBox />
        </div>

      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import OrderSummary from "../components/checkout/OrderSummary";

const PAYMENT_METHODS = [
  { id: "credit", label: "Credit Card" },
  { id: "paypal", label: "PayPal (mock)" },
];

function Field({ name, label, placeholder, span, form, errors, setForm, setErrors }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 text-gray-800 outline-none transition-colors focus:border-brand
          ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => {
          setForm({ ...form, [name]: e.target.value });
          setErrors({ ...errors, [name]: "" });
        }}
      />
      {errors[name] && (
        <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>
      )}
    </div>
  );
}

export default function Checkout() {
  const { cartItems, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [payment, setPayment] = useState("credit");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "",
    city: "", state: "", zip: "", email: "", phone: "",
  });
  const [errors, setErrors] = useState({});

  if (cartItems.length === 0 && !success) {
    return (
      <div className="page-container text-center py-16">
        <p className="text-base text-gray-400 mb-4">No items to checkout.</p>
        <Link to="/" className="text-brand font-semibold">← Back to shop</Link>
      </div>
    );
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    return e;
  }

  function handlePlace() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSuccess(true);
    clearCart();
  }

  const fieldProps = { form, errors, setForm, setErrors };

  return (
    <div className="page-container">

      {/* Success modal */}
      {success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-[90%] shadow-card-lg">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-2xl font-normal mb-2 text-gray-800">Order Placed!</h2>
            <p className="text-sm text-gray-400 mb-6">
              Thank you for your purchase. Your medicines will be delivered soon.
            </p>
            <button
              className="w-full py-3 bg-brand text-white text-base font-bold rounded-xl border-none cursor-pointer hover:bg-brand-dark transition-colors"
              onClick={() => navigate("/")}
            >
              Back to Shop
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link to="/" className="text-brand">Home</Link>
        <span>›</span>
        <Link to="/cart" className="text-brand">Cart</Link>
        <span>›</span>
        <span>Checkout</span>
      </div>

      <h1 className="font-display text-[28px] font-normal text-gray-800 mb-6">Checkout</h1>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>

        <div>
          {/* Shipping */}
          <div className="bg-white rounded-xl shadow-card p-7 mb-5">
            <div className="text-base font-bold text-gray-800 mb-5">Shipping Address</div>
            <div className="grid grid-cols-2 gap-3.5">
              <Field name="firstName" label="First Name" placeholder="John" {...fieldProps} />
              <Field name="lastName" label="Last Name" placeholder="Doe" {...fieldProps} />
              <Field name="address" label="Shipping Address" placeholder="123 Main Street" span {...fieldProps} />
              <Field name="city" label="City" placeholder="New York" {...fieldProps} />
              <Field name="state" label="State" placeholder="NY" {...fieldProps} />
              <Field name="zip" label="ZIP Code" placeholder="10001" {...fieldProps} />
              <Field name="email" label="Email" placeholder="john@example.com" span {...fieldProps} />
              <Field name="phone" label="Phone (optional)" placeholder="+1 555 000 0000" span {...fieldProps} />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-card p-7">
            <div className="text-base font-bold text-gray-800 mb-5">Payment Method</div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer text-sm transition-colors
                    ${payment === m.id
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => setPayment(m.id)}
                >
                  {/* Radio dot */}
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${payment === m.id ? "border-brand" : "border-gray-300"}`}>
                    {payment === m.id && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  {m.label}
                </div>
              ))}
            </div>

            {payment === "credit" && (
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Card Number</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Expiry</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="MM/YY" maxLength={5} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">CVV</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-brand transition-colors" placeholder="•••" maxLength={4} type="password" />
                </div>
              </div>
            )}

            <button
              className="w-full py-3.5 bg-brand text-white text-base font-bold rounded-xl border-none cursor-pointer hover:bg-brand-dark transition-colors"
              onClick={handlePlace}
            >
              Complete Order — ${total.toFixed(2)}
            </button>
          </div>
        </div>

        <OrderSummary />
      </div>
    </div>
  );
}

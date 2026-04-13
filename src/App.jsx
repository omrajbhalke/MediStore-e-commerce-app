import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/common/Navbar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />
        <AppRoutes />
      </CartProvider>
    </BrowserRouter>
  );
}

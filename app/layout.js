import CartProvider from "./context/CartContext";
import Header from "./components/Header";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // اضافه کردن این خط برای Toast

export default function RootLayout({ children }) {
  return (
    <html lang="fa">
      <body>
        <CartProvider>
          <Header />
          {children}
          <Toaster position="top-center" /> {/* اضافه کردن Toaster */}
        </CartProvider>
      </body>
    </html>
  );
}
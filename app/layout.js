import CartProvider from "./context/CartContext";
import FavoritesProvider from "./context/FavoritesContext";
import Header from "./components/Header";
import PerformanceMonitor from "./components/PerformanceMonitor";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // اضافه کردن این خط برای Toast
import Footer from "./components/Footer";

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="بیگ‌بیر - سوپرمارکت آنلاین با بهترین کیفیت و قیمت" />
        <meta name="theme-color" content="#663191" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="بیگ‌بیر" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] min-h-screen flex flex-col">
        <CartProvider>
          <FavoritesProvider>
            <ServiceWorkerRegistration />
            <PerformanceMonitor enabled={process.env.NODE_ENV === 'production'} />
            <Header />
            <main className="container mx-auto px-4 flex-1 w-full max-w-7xl">
              {children}
            </main>
            <Footer />
            <Toaster position="top-center" /> {/* اضافه کردن Toaster */}
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
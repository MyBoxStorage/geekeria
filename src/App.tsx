import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import HomePage from "@/pages/HomePage";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutFailure from "@/pages/CheckoutFailure";
import CheckoutPending from "@/pages/CheckoutPending";
import OrderTracking from "@/pages/OrderTracking";
import UserDashboard from "@/pages/UserDashboard";
import { MinhasEstampasPage } from "@/pages/MinhasEstampasPage";
import { CatalogPage } from "@/pages/CatalogPage";

// Admin — lazy loaded to avoid Supabase env crash in production
const AdminUnifiedPage = lazy(() =>
  import("@/pages/AdminUnifiedPage").then((m) => ({
    default: m.AdminUnifiedPage,
  }))
);

function App() {
  useEffect(() => {
    if (import.meta.env.DEV) console.log("App initialized");
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/failure" element={<CheckoutFailure />} />
        <Route path="/checkout/pending" element={<CheckoutPending />} />
        <Route path="/minha-conta" element={<UserDashboard />} />
        <Route path="/order" element={<OrderTracking />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }} />}>
              <AdminUnifiedPage />
            </Suspense>
          }
        />
        <Route path="/minhas-estampas" element={<MinhasEstampasPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import HomePage from "@/pages/HomePage";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutFailure from "@/pages/CheckoutFailure";
import CheckoutPending from "@/pages/CheckoutPending";
import OrderTracking from "@/pages/OrderTracking";
import UserDashboard from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import { AdminGenerationsPage } from "@/pages/AdminGenerationsPage";
import { AdminPromptsPage } from "@/pages/AdminPromptsPage";
import { AdminCouponsPage } from "@/pages/AdminCouponsPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { MinhasEstampasPage } from "@/pages/MinhasEstampasPage";
import { CatalogPage } from "@/pages/CatalogPage";

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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/generations" element={<AdminGenerationsPage />} />
        <Route path="/admin/prompts" element={<AdminPromptsPage />} />
        <Route path="/admin/coupons" element={<AdminCouponsPage />} />
        <Route path="/minhas-estampas" element={<MinhasEstampasPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

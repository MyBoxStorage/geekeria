import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import HomePage from "@/pages/HomePage";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutFailure from "@/pages/CheckoutFailure";
import CheckoutPending from "@/pages/CheckoutPending";
import OrderTracking from "@/pages/OrderTracking";
import AdminDashboard from "@/pages/AdminDashboard";
import { AdminGenerationsPage } from "@/pages/AdminGenerationsPage";
import { AdminPromptsPage } from "@/pages/AdminPromptsPage";
import { AdminCouponsPage } from "@/pages/AdminCouponsPage";
import { MinhasEstampasPage } from "@/pages/MinhasEstampasPage";

function App() {
  useEffect(() => {
    if (import.meta.env.DEV) console.log("App initialized");
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/failure" element={<CheckoutFailure />} />
        <Route path="/checkout/pending" element={<CheckoutPending />} />
        <Route path="/order" element={<OrderTracking />} />
        <Route path="/admin" element={<AdminDashboard />} />
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

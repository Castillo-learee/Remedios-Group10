import { useEffect, useState } from "react";
import "./index.css";

import { useAuth } from "./context/AuthContext";

// Layouts 
import AdminLayout    from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";

// Auth pages 
import Login    from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Admin pages 
import Dashboard  from "./pages/admin/Dashboard";
import POSOrders  from "./pages/admin/POSOrders";
import Inventory  from "./pages/admin/Inventory";
import Analytics  from "./pages/admin/Analytics";
import Promotions from "./pages/admin/Promotions";

// Customer pages 
import Home     from "./pages/customer/Home";
import Shop     from "./pages/customer/Shop";
import MyOrders from "./pages/customer/MyOrders";

// Page maps
const ADMIN_PAGES = {
  dashboard:    Dashboard,
  "pos-orders": POSOrders,
  inventory:    Inventory,
  analytics:    Analytics,
  promotions:   Promotions,
};

const CUSTOMER_PAGES = {
  home:       Home,
  shop:       Shop,
  "my-orders": MyOrders,
};

// App
export default function App() {
  const { auth } = useAuth();

  const [authView,     setAuthView]     = useState("login");
  const [adminPage,    setAdminPage]    = useState("dashboard");
  const [customerPage, setCustomerPage] = useState("home");

  // Reset to home pages on logout
  useEffect(() => {
    if (!auth) {
      setAdminPage("dashboard");
      setCustomerPage("home");
    }
  }, [auth]);

  // Not logged in → show login or register 
  if (!auth) {
    return (
      <div className="auth-layout">
        <div className="auth-hero">
          <div className="auth-hero-inner">
            <div className="auth-hero-logo">R</div>
            <h1>Remedios</h1>
            <p>Plastic Ware &amp; Native Products</p>
            <ul className="auth-hero-bullets">
              <li>Browse and order products online</li>
              <li>Track your orders in real time</li>
              <li>Exclusive vouchers and promotions</li>
            </ul>
          </div>
        </div>
        <div className="auth-panel">
          {authView === "login"
            ? <Login    onGoRegister={() => setAuthView("register")} />
            : <Register onGoLogin={()   => setAuthView("login")} />
          }
        </div>
      </div>
    );
  }

  // Admin 
  if (auth.user?.role === "admin") {
    const AdminPage = ADMIN_PAGES[adminPage] ?? Dashboard;
    return (
      <AdminLayout current={adminPage} onNavigate={setAdminPage}>
        <AdminPage onNavigate={setAdminPage} />
      </AdminLayout>
    );
  }

  // Customer 
  const CustomerPage = CUSTOMER_PAGES[customerPage] ?? Home;
  return (
    <CustomerLayout current={customerPage} onNavigate={setCustomerPage}>
      <CustomerPage onNavigate={setCustomerPage} />
    </CustomerLayout>
  );
} 

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE, NETWORK_ERROR, apiFetch } from "../../services/api";
import { fmtPrice } from "../../constants/format";

const MODULES = [
  {
    id:    "pos-orders",
    label: "POS & Customer Orders",
    icon:  "🛒",
    desc:  "Process walk-in sales, manage customer orders, and view transaction receipts.",
    sub:   ["Point of Sale", "Customer Orders", "Transaction History"],
  },
  {
    id:    "inventory",
    label: "Inventory",
    icon:  "📦",
    desc:  "Add and manage products, record stock movements, and monitor low-stock alerts.",
    sub:   ["Products", "Stock Management"],
  },
  {
    id:    "analytics",
    label: "Analytics",
    icon:  "📊",
    desc:  "View sales trends, revenue summaries, best-selling products, and order status.",
    sub:   ["Sales Analytics", "Top Products"],
  },
  {
    id:    "promotions",
    label: "Promotions",
    icon:  "🏷️",
    desc:  "Create discount campaigns, generate voucher codes, and manage promotion schedules.",
    sub:   ["Create Promotion", "Voucher Codes"],
  },
];

export default function Dashboard({ onNavigate }) {
  const { auth } = useAuth();

  const [invSummary,   setInvSummary]   = useState(null);
  const [lowStock,     setLowStock]     = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [orderStatus,  setOrderStatus]  = useState(null);
  const [error,        setError]        = useState("");

  useEffect(() => {
    const now = new Date();
    Promise.all([
      apiFetch(`${API_BASE}/inventory/summary`),
      apiFetch(`${API_BASE}/inventory/low-stock`),
      apiFetch(`${API_BASE}/analytics/summary?year=${now.getFullYear()}&month=${now.getMonth()+1}`),
      apiFetch(`${API_BASE}/analytics/order-status`),
    ])
      .then(([inv, low, sales, orders]) => {
        setInvSummary(inv);
        setLowStock(low);
        setSalesSummary(sales);
        setOrderStatus(orders);
      })
      .catch((e) => setError(e instanceof TypeError ? NETWORK_ERROR : e.message));
  }, []);

  const name       = auth?.user?.firstName ?? "Admin";
  const now        = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalOrders = orderStatus
    ? Object.values(orderStatus).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      {/* Greeting */}
      <section id="headerContainer">
        <h1>Welcome back, {name}!</h1>
        <small>Store overview — {monthLabel}</small>
      </section>

      {error && (
        <div className="notice error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="dash-kpis">
        <div className="dash-kpi">
          <span className="dash-kpi-value">{salesSummary ? fmtPrice(salesSummary.revenue) : "—"}</span>
          <span className="dash-kpi-label">Revenue this month</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{salesSummary ? salesSummary.unitsSold : "—"}</span>
          <span className="dash-kpi-label">Units sold</span>
        </div>
        <div className="dash-kpi dash-kpi--warn">
          <span className="dash-kpi-value">{orderStatus ? (orderStatus.Pending ?? 0) : "—"}</span>
          <span className="dash-kpi-label">Pending orders</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{invSummary ? invSummary.totalProducts : "—"}</span>
          <span className="dash-kpi-label">Products</span>
        </div>
        <div className="dash-kpi dash-kpi--danger">
          <span className="dash-kpi-value">{invSummary ? invSummary.lowStock : "—"}</span>
          <span className="dash-kpi-label">Low stock</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-value">{orderStatus ? totalOrders : "—"}</span>
          <span className="dash-kpi-label">Total orders</span>
        </div>
      </div>

      {/* Low-stock alert */}
      {lowStock.length > 0 && (
        <section id="lowStockAlert" role="alert">
          <strong>
            {lowStock.length} {lowStock.length === 1 ? "product needs" : "products need"} restocking
          </strong>
          <ul>
            {lowStock.slice(0, 5).map((p) => (
              <li key={p.product_id}>
                {p.product_name}:{" "}
                {p.stock_quantity === 0
                  ? "out of stock"
                  : `${p.stock_quantity} left (reorder at ${p.reorder_level})`}
              </li>
            ))}
          </ul>
          {lowStock.length > 5 && <small>…and {lowStock.length - 5} more</small>}
        </section>
      )}

      {/* Four module cards */}
      <div className="dash-modules">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            className="dash-module-card"
            onClick={() => onNavigate && onNavigate(mod.id)}
          >
            <div className="dash-module-icon">{mod.icon}</div>
            <div className="dash-module-body">
              <strong className="dash-module-title">{mod.label}</strong>
              <p className="dash-module-desc">{mod.desc}</p>
              <div className="dash-module-links">
                {mod.sub.map((s) => (
                  <span key={s} className="dash-module-link">{s}</span>
                ))}
              </div>
            </div>
            <span className="dash-module-arrow">→</span>
          </button>
        ))}
      </div>
    </>
  );
}

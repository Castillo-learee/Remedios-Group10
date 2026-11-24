import { useEffect, useState } from "react";
import { API_BASE, NETWORK_ERROR, apiFetch } from "../../services/api";
import { fmtPrice, fmtMonth } from "../../constants/format";
import { getStockStatus } from "../../constants/stockStatus";

const ANA = `${API_BASE}/analytics`;

function ChangeChip({ value }) {
  if (value === null || value === undefined) return <span className="muted">—</span>;
  const cls = value > 0 ? "in" : value < 0 ? "out" : "muted";
  return <span className={cls}>{value > 0 ? "+" : ""}{value}%</span>;
}

function StatusBadge({ stock, reorderLevel }) {
  const { label, className } = getStockStatus(stock, reorderLevel);
  return <span className={className}>{label}</span>;
}

export default function Analytics() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [summary,      setSummary]      = useState(null);
  const [trend,        setTrend]        = useState(null);
  const [orderStatus,  setOrderStatus]  = useState(null);
  const [topProducts,  setTopProducts]  = useState([]);
  const [productTable, setProductTable] = useState([]);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(true);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      apiFetch(`${ANA}/summary?year=${year}&month=${month}`),
      apiFetch(`${ANA}/trend?year=${year}&month=${month}`),
      apiFetch(`${ANA}/order-status`),
      apiFetch(`${ANA}/top-products`),
      apiFetch(`${ANA}/products`),
    ])
      .then(([sum, trnd, os, top, prods]) => {
        setSummary(sum);
        setTrend(trnd);
        setOrderStatus(os);
        setTopProducts(top);
        setProductTable(prods);
      })
      .catch((e) => setError(e instanceof TypeError ? NETWORK_ERROR : e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [year, month]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years  = Array.from({ length: 5  }, (_, i) => now.getFullYear() - i);

  const totalOrders = orderStatus
    ? Object.values(orderStatus).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <section id="headerContainer">
        <h1>Analytics</h1>
        <small>Sales performance and product insights</small>
        <div className="toolbar">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m) => (
              <option key={m} value={m}>
                {new Date(year, m - 1).toLocaleDateString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </section>

      {error && <p className="notice error"><span>{error}</span></p>}

      {/* Revenue + units */}
      {summary && (
        <section id="summaryCards">
          <div className="summary-card">
            <strong>{fmtPrice(summary.revenue)}</strong>
            <span>Revenue — {fmtMonth(year, month)} <ChangeChip value={summary.revenueChangePercent} /></span>
          </div>
          <div className="summary-card">
            <strong>{summary.unitsSold}</strong>
            <span>Units Sold — {fmtMonth(year, month)} <ChangeChip value={summary.unitsChangePercent} /></span>
          </div>
          <div className="summary-card">
            <strong>{fmtPrice(summary.revenuePrevious)}</strong>
            <span>Revenue — {fmtMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1)}</span>
          </div>
        </section>
      )}

      {/* Order status */}
      {orderStatus && totalOrders > 0 && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <h2>Order Status</h2>
          <dl className="meta" style={{ marginTop: 8 }}>
            {Object.entries(orderStatus).map(([status, count]) => (
              <>
                <dt key={`dt-${status}`}>{status}</dt>
                <dd key={`dd-${status}`}>{count} ({Math.round(count / totalOrders * 100)}%)</dd>
              </>
            ))}
          </dl>
        </section>
      )}

      {/* Daily revenue trend */}
      {trend && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <h2>Daily Revenue — {fmtMonth(year, month)}</h2>
          {trend.current.length === 0
            ? <p className="muted">No sales recorded for this month.</p>
            : (
              <table className="detail-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Day</th><th style={{ textAlign:"right" }}>Revenue</th></tr></thead>
                <tbody>
                  {trend.current.map((row) => (
                    <tr key={row.day}>
                      <td>Day {row.day}</td>
                      <td style={{ textAlign:"right" }}>{fmtPrice(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </section>
      )}

      {/* Top 5 products */}
      {topProducts.length > 0 && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <h2>Top 5 Best-Selling Products</h2>
          <table className="detail-table" style={{ marginTop: 8 }}>
            <thead><tr><th>#</th><th>Product</th><th>Category</th><th style={{ textAlign:"right" }}>Total Sold</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td><td>{p.name}</td><td>{p.category}</td>
                  <td style={{ textAlign:"right" }}>{p.totalSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Product analytics table */}
      <section id="listContainer">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Total Sold</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="empty">Loading…</td></tr>}
            {!loading && productTable.length === 0 && <tr><td colSpan={6} className="empty">No products found.</td></tr>}
            {productTable.map((p) => (
              <tr key={p.id} className="list-item">
                <td>{p.name}</td><td>{p.category}</td><td>{fmtPrice(p.price)}</td>
                <td>{p.stock}</td>
                <td><StatusBadge stock={p.stock} reorderLevel={p.reorder_level} /></td>
                <td>{p.totalSold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

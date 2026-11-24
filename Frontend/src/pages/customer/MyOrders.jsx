import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS, apiFetch, NETWORK_ERROR } from "../../services/api";
import { fmtPrice, fmtDate } from "../../constants/format";
import Modal from "../../components/Modal";
import { printReceipt } from "../../utils/printReceipt";

const statusClass = {
  Pending:   "low",
  Confirmed: "low",
  Completed: "in",
  Cancelled: "out",
};

const paymentStatusClass = {
  Unpaid:   "low",
  Paid:     "in",
  Refunded: "out",
};

// ── Receipt panel shown inside the modal ─────────────────────────────────────
function OrderReceipt({ order, onClose }) {
  const orderNo = order.order_no ?? `ORD-${String(order.order_id).padStart(3, "0")}`;

  return (
    <div id="order-receipt-print" className="panel receipt-panel">

      {/* Store header */}
      <div className="receipt-store">
        <strong>Remedios</strong>
        <span>Plastic Ware &amp; Native Products</span>
      </div>

      {/* Order meta */}
      <div className="panel-head">
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Order #{orderNo}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary" onClick={() => printReceipt("order-receipt-print")}>
            🖨 Print
          </button>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      <dl className="meta">
        <dt>Name</dt>
        <dd>{order.first_name} {order.last_name}</dd>

        <dt>Order Date</dt>
        <dd>{fmtDate(order.order_date)}</dd>

        <dt>Payment Method</dt>
        <dd>{order.payment_method === "gcash" ? "GCash QR Code" : "Cash (Pay at Counter)"}</dd>

        <dt>Payment Status</dt>
        <dd>
          <span className={`badge ${paymentStatusClass[order.payment_status] ?? ""}`}>
            {order.payment_status}
          </span>
        </dd>

        <dt>Order Status</dt>
        <dd>
          <span className={`badge ${statusClass[order.order_status] ?? ""}`}>
            {order.order_status}
          </span>
        </dd>
      </dl>

      {/* Items table */}
      <table className="detail-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style={{ textAlign: "right" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Unit Price</th>
            <th style={{ textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(order.items ?? []).length === 0 && (
            <tr><td colSpan={4} className="empty">No items found.</td></tr>
          )}
          {(order.items ?? []).map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td style={{ textAlign: "right" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>{fmtPrice(item.unit_price)}</td>
              <td style={{ textAlign: "right" }}>{fmtPrice(item.sub_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="total">Total: {fmtPrice(order.total_amount)}</p>

      <p className="receipt-thanks">
        {order.order_status === "Completed"
          ? "Thank you for your purchase!"
          : order.order_status === "Cancelled"
          ? "This order has been cancelled."
          : "Your order is being processed. Please wait for confirmation."}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyOrders() {
  const { auth }   = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState(""); // filter by status
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    apiFetch(ENDPOINTS.orders)
      .then((all) => {
        // show only this customer's orders
        const mine = all.filter((o) => o.account_id === auth?.user?.id);
        setOrders(mine);
      })
      .catch((e) => setError(e instanceof TypeError ? NETWORK_ERROR : e.message))
      .finally(() => setLoading(false));
  }, []);

  const viewOrder = async (order) => {
    try {
      const full = await apiFetch(ENDPOINTS.orderById(order.order_id));
      setSelected(full);
    } catch (e) {
      setError(e instanceof TypeError ? NETWORK_ERROR : e.message);
    }
  };

  const visible = orders.filter((o) => {
    const orderNo = o.order_no ?? `ORD-${String(o.order_id).padStart(3, "0")}`;
    const matchSearch = `${orderNo} ${o.order_status}`
      .toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || o.order_status === filter;
    return matchSearch && matchFilter;
  });

  const orderNo = (o) => o.order_no ?? `ORD-${String(o.order_id).padStart(3, "0")}`;

  return (
    <>
      <div className="customer-page-header">
        <h1>My Orders</h1>
        <small>Track your order history and receipts</small>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search by order # or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="notice error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <section id="listContainer">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="empty">Loading…</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={8} className="empty">No orders found.</td></tr>
            )}
            {visible.map((o) => (
              <tr key={o.order_id} className="list-item">
                <td><strong>{orderNo(o)}</strong></td>
                <td>{fmtDate(o.order_date)}</td>
                <td>{o.payment_method === "gcash" ? "GCash" : "Cash"}</td>
                <td>{o.item_count}</td>
                <td>{fmtPrice(o.total_amount)}</td>
                <td>
                  <span className={`badge ${paymentStatusClass[o.payment_status] ?? ""}`}>
                    {o.payment_status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statusClass[o.order_status] ?? ""}`}>
                    {o.order_status}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => viewOrder(o)}>View Receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Receipt modal */}
      {selected && (
        <Modal
          title={`Receipt — ${selected.order_no ?? `ORD-${String(selected.order_id).padStart(3, "0")}`}`}
          onClose={() => setSelected(null)}
        >
          <OrderReceipt
            order={selected}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}
    </>
  );
}

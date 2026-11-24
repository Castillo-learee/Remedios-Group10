import { useEffect, useState } from "react";
import { API_BASE, NETWORK_ERROR, apiFetch } from "../../services/api";
import { fmtDate } from "../../constants/format";
import Modal from "../../components/Modal";

const PROMO_URL = `${API_BASE}/promotion`;

const emptyForm = {
  name: "", discountType: "percentage", discountValue: "",
  voucherCode: "", appliesTo: "all", appliesValue: "",
  startDate: "", endDate: "", usageLimit: "",
};

const statusClass = { Active: "in", Scheduled: "low", Expired: "out", Disabled: "out", "Limit Reached": "out" };

function PromoForm({ promo, onSave, onCancel }) {
  const [form, setForm] = useState(promo ? {
    name: promo.name,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
    voucherCode: promo.voucher_code ?? "",
    appliesTo: promo.applies_to,
    appliesValue: promo.applies_value ?? "",
    startDate: promo.start_date ?? "",
    endDate: promo.end_date ?? "",
    usageLimit: promo.usage_limit ?? "",
  } : emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const problem = await onSave(form);
    setSaving(false);
    if (problem) setError(problem);
  };

  return (
    <form className="sale-form" onSubmit={handleSubmit}>
      <div className="sale-fields">
        <div className="input-field wide">
          <label htmlFor="name">Promotion Name</label>
          <input id="name" name="name" value={form.name} onChange={setField} required />
        </div>
        <div className="input-field">
          <label htmlFor="discountType">Discount Type</label>
          <select id="discountType" name="discountType" value={form.discountType} onChange={setField}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₱)</option>
          </select>
        </div>
        <div className="input-field">
          <label htmlFor="discountValue">
            Discount Value {form.discountType === "percentage" ? "(%)" : "(₱)"}
          </label>
          <input id="discountValue" name="discountValue" type="number" min="0.01" step="0.01"
            value={form.discountValue} onChange={setField} required />
        </div>
        <div className="input-field">
          <label htmlFor="voucherCode">Voucher Code (optional)</label>
          <input id="voucherCode" name="voucherCode" value={form.voucherCode} onChange={setField}
            placeholder="e.g. SAVE10" />
        </div>
        <div className="input-field">
          <label htmlFor="appliesTo">Applies To</label>
          <select id="appliesTo" name="appliesTo" value={form.appliesTo} onChange={setField}>
            <option value="all">All Products</option>
            <option value="category">Category</option>
            <option value="product">Specific Product</option>
          </select>
        </div>
        {form.appliesTo !== "all" && (
          <div className="input-field">
            <label htmlFor="appliesValue">
              {form.appliesTo === "category" ? "Category Name" : "Product Name"}
            </label>
            <input id="appliesValue" name="appliesValue" value={form.appliesValue}
              onChange={setField} required />
          </div>
        )}
        <div className="input-field">
          <label htmlFor="startDate">Start Date (optional)</label>
          <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={setField} />
        </div>
        <div className="input-field">
          <label htmlFor="endDate">End Date (optional)</label>
          <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={setField} />
        </div>
        <div className="input-field">
          <label htmlFor="usageLimit">Usage Limit (optional)</label>
          <input id="usageLimit" name="usageLimit" type="number" min="1" step="1"
            value={form.usageLimit} onChange={setField} placeholder="Leave blank for unlimited" />
        </div>
      </div>
      {error && <p className="notice error form-error" role="alert"><span>{error}</span></p>}
      <div className="form-footer">
        <button type="submit" disabled={saving}>{promo ? "Save Changes" : "Create Promotion"}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Promotions() {
  const [promos, setPromos]             = useState([]);
  const [modal, setModal]               = useState(null); // null | { mode: 'add'|'edit', promo? }
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType]     = useState("");
  const [notice, setNotice]             = useState(null);
  const [loading, setLoading]           = useState(true);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    if (type === "success") setTimeout(() => setNotice(null), 4000);
  };
  const showError = (e) =>
    showNotice("error", e instanceof TypeError ? NETWORK_ERROR : e.message);

  const loadAll = () => {
    const params = new URLSearchParams();
    if (search) params.set("name", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("discountType", filterType);
    apiFetch(`${PROMO_URL}?${params}`)
      .then(setPromos)
      .catch(showError)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [search, filterStatus, filterType]);

  const handleSave = async (data) => {
    const isEdit = modal?.mode === "edit";
    const url = isEdit ? `${PROMO_URL}/${modal.promo.id}` : PROMO_URL;
    const method = isEdit ? "PUT" : "POST";
    try {
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      showNotice("success", isEdit ? "Promotion updated." : "Promotion created.");
      setModal(null);
      loadAll();
    } catch (e) {
      return e instanceof TypeError ? NETWORK_ERROR : e.message;
    }
  };

  const handleToggle = async (promo) => {
    const enabled = !promo.is_enabled;
    try {
      await apiFetch(`${PROMO_URL}/${promo.id}/enabled`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      showNotice("success", `Promotion ${enabled ? "enabled" : "disabled"}.`);
      loadAll();
    } catch (e) {
      showError(e);
    }
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`Delete "${promo.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`${PROMO_URL}/${promo.id}`, { method: "DELETE" });
      showNotice("success", `"${promo.name}" deleted.`);
      loadAll();
    } catch (e) {
      showError(e);
    }
  };

  const fmtDiscount = (p) =>
    p.discount_type === "percentage"
      ? `${p.discount_value}%`
      : `₱${Number(p.discount_value).toFixed(2)}`;

  return (
    <>
      <section id="headerContainer">
        <h1>Promotions</h1>
        <small>Manage discounts and voucher codes</small>
        <div className="toolbar">
          <input type="search" placeholder="Search promotions…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Expired">Expired</option>
            <option value="Disabled">Disabled</option>
            <option value="Limit Reached">Limit Reached</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          <button onClick={() => setModal({ mode: "add" })}>+ New Promotion</button>
        </div>
      </section>

      {notice && (
        <div className={`notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section id="listContainer">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Discount</th><th>Voucher Code</th>
              <th>Applies To</th><th>Expires</th><th>Usage</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="empty">Loading…</td></tr>}
            {!loading && promos.length === 0 && (
              <tr><td colSpan={8} className="empty">No promotions found.</td></tr>
            )}
            {promos.map((p) => (
              <tr key={p.id} className="list-item">
                <td><strong>{p.name}</strong></td>
                <td>{fmtDiscount(p)}</td>
                <td>{p.voucher_code ?? "—"}</td>
                <td>
                  {p.applies_to === "all" ? "All Products"
                    : p.applies_to === "category" ? `Category: ${p.applies_value}`
                    : `Product: ${p.applies_value}`}
                </td>
                <td>{p.end_date ? fmtDate(p.end_date) : "—"}</td>
                <td>
                  {p.usage_limit
                    ? `${p.usage_count} / ${p.usage_limit}`
                    : `${p.usage_count} / ∞`}
                </td>
                <td>
                  <span className={`badge ${statusClass[p.status] ?? ""}`}>{p.status}</span>
                </td>
                <td className="actions">
                  <button onClick={() => setModal({ mode: "edit", promo: p })}>Edit</button>
                  <button className="secondary" onClick={() => handleToggle(p)}>
                    {p.is_enabled ? "Disable" : "Enable"}
                  </button>
                  <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {modal && (
        <Modal
          title={modal.mode === "add" ? "New Promotion" : "Edit Promotion"}
          onClose={() => setModal(null)}
        >
          <PromoForm
            promo={modal.promo}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
}

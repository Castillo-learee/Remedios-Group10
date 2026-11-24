import { useEffect, useState } from "react";
import { ENDPOINTS, apiFetch, NETWORK_ERROR } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/ProductCard";
import Modal from "../../components/Modal";
import Checkout from "./Checkout";

export default function Shop() {
  const { auth }  = useAuth();
  const [products,  setProducts]  = useState([]);
  const [category,  setCategory]  = useState("");
  const [search,    setSearch]    = useState("");
  const [notice,    setNotice]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // product to order

  const showNotice = (type, text) => {
    setNotice({ type, text });
    if (type === "success") setTimeout(() => setNotice(null), 5000);
  };

  const load = () =>
    apiFetch(ENDPOINTS.products)
      .then(setProducts)
      .catch((e) => showNotice("error", e instanceof TypeError ? NETWORK_ERROR : e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const categories = [...new Set(products.map((p) => p.category))].sort();
  const visible = products.filter((p) => {
    const matchSearch = p.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !category || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <>
      {/* Header */}
      <div className="customer-page-header">
        <h1>Shop</h1>
        <small>Browse all available products</small>
        <div className="toolbar">
          <input type="search" placeholder="Search products…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {notice && (
        <div className={`notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {/* Category chips */}
      <div className="chips">
        <button className={`chip${!category ? " active" : ""}`}
          onClick={() => setCategory("")}>All</button>
        {categories.map((c) => (
          <button key={c} className={`chip${category === c ? " active" : ""}`}
            onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      <div className="product-grid">
        {loading && <p className="muted">Loading products…</p>}
        {!loading && visible.length === 0 && (
          <p className="muted">No products found.</p>
        )}
        {visible.map((p) => (
          <ProductCard key={p.product_id} product={p}
            onOrder={() => setSelected(p)} />
        ))}
      </div>

      {/* Checkout modal */}
      {selected && (
        <Modal title={`Order — ${selected.product_name}`}
          onClose={() => setSelected(null)}>
          <Checkout
            product={selected}
            user={auth?.user}
            onSuccess={(msg) => {
              setSelected(null);
              showNotice("success", msg);
              load();
            }}
            onCancel={() => setSelected(null)}
          />
        </Modal>
      )}
    </>
  );
}

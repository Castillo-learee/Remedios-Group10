import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS, apiFetch, NETWORK_ERROR } from "../../services/api";
import ProductCard from "../../components/ProductCard";

export default function Home({ onNavigate }) {
  const { auth } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [error,    setError]    = useState("");

  useEffect(() => {
    apiFetch(ENDPOINTS.products)
      .then((all) => setFeatured(all.filter((p) => p.stock_quantity > 0).slice(0, 4)))
      .catch((e) => setError(e instanceof TypeError ? NETWORK_ERROR : e.message));
  }, []);

  const user = auth?.user;

  return (
    <div className="customer-home">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Welcome{user ? `, ${user.firstName}` : ""}!</h1>
          <p>
            Discover quality plastic ware and native products from Remedios.
            Browse our catalogue and place your order online.
          </p>
          <button className="auth-btn" style={{ width: "fit-content" }}
            onClick={() => onNavigate("shop")}>
            Shop Now
          </button>
        </div>
        <div className="home-hero-badge">R</div>
      </section>

      {error && (
        <div className="notice error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section>
          <h2 className="section-title">Featured Products</h2>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                onOrder={() => onNavigate("shop")}
              />
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button className="secondary" onClick={() => onNavigate("shop")}>
              View All Products →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

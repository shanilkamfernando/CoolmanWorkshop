import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "./StoresDashboard.css";

interface User {
  username: string;
  firstname: string;
  lastname: string;
  role: string;
}
interface Category {
  id: number;
  key: string;
  label: string;
  icon: string;
  sort_order: number;
}

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 1,
    key: "compressor_spare_parts",
    label: "Compressor Spare Parts",
    icon: "⚙️",
    sort_order: 1,
  },
  { id: 2, key: "fittings", label: "Fittings", icon: "🔩", sort_order: 2 },
  { id: 3, key: "pipes", label: "Pipes", icon: "🪠", sort_order: 3 },
  { id: 4, key: "valves", label: "Valves", icon: "🔧", sort_order: 4 },
  {
    id: 5,
    key: "electrical_items",
    label: "Electrical Items",
    icon: "⚡",
    sort_order: 5,
  },
  { id: 6, key: "others", label: "Others", icon: "📦", sort_order: 6 },
];

const CARD_COLORS = [
  { bg: "#e8f4fd", border: "#2196F3", icon: "#1565c0" },
  { bg: "#fff3e0", border: "#FF9800", icon: "#e65100" },
  { bg: "#e8f5e9", border: "#4CAF50", icon: "#2e7d32" },
  { bg: "#fce4ec", border: "#E91E63", icon: "#880e4f" },
  { bg: "#fff8e1", border: "#FFC107", icon: "#f57f17" },
  { bg: "#ede7f6", border: "#9C27B0", icon: "#4a148c" },
];

const StoresLanding = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/stores/categories",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.categories?.length) setCategories(res.data.categories);
    } catch {
      // use fallback
    }
  };

  return (
    <div className="stores-dashboard">
      {/* Header */}
      <div className="stores-header">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => navigate("/dashboard")}
          >
            <img src={companyLogo} alt="Logo" className="company-logo" />
          </div>
          <h1 className="header-title" onClick={() => navigate("/dashboard")}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="customer-logo-text">Stores</span>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* Main */}
      <div className="stores-main-content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#222",
              }}
            >
              🏪 Stores Inventory
            </h2>
            <p style={{ margin: "6px 0 0", color: "#888", fontSize: "1rem" }}>
              Select a category to view brands and stock
            </p>
          </div>
          <button
            className="btn-search"
            style={{ padding: "10px 20px" }}
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {/* Category Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {categories.map((cat, idx) => {
            const clr = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <div
                key={cat.key}
                onClick={() => navigate(`/stores/${cat.key}`)}
                style={{
                  background: clr.bg,
                  border: `2px solid ${clr.border}`,
                  borderRadius: "16px",
                  padding: "32px 28px",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    `0 8px 24px rgba(0,0,0,0.12)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.06)";
                }}
              >
                <div style={{ fontSize: "3rem" }}>{cat.icon}</div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: clr.icon,
                    }}
                  >
                    {cat.label}
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.88rem",
                      color: "#666",
                    }}
                  >
                    Click to view brands →
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoresLanding;

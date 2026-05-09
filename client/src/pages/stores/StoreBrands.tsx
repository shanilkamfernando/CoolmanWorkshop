// ============================================
// Store Brands Page - Brands within a Category
// Save as: client/src/pages/stores/StoreBrands.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "./StoresDashboard.css";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Brand {
  id: number;
  category_key: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  item_count: number;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  compressor_spare_parts: {
    label: "Compressor Spare Parts",
    icon: "⚙️",
    color: "#2196F3",
  },
  fittings: { label: "Fittings", icon: "🔩", color: "#FF9800" },
  pipes: { label: "Pipes", icon: "🪠", color: "#4CAF50" },
  valves: { label: "Valves", icon: "🔧", color: "#E91E63" },
  electrical_items: { label: "Electrical Items", icon: "⚡", color: "#FFC107" },
  others: { label: "Others", icon: "📦", color: "#9C27B0" },
};

const StoreBrands = () => {
  const navigate = useNavigate();
  const { categoryKey } = useParams<{ categoryKey: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Add brand form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const meta = CATEGORY_META[categoryKey || ""] || {
    label: categoryKey,
    icon: "📦",
    color: "#667eea",
  };
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchBrands();
  }, [categoryKey]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/stores/categories/${categoryKey}/brands`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBrands(res.data.brands || []);
    } catch (e) {
      console.error(e);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newName.trim()) {
      alert("Brand name is required");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/stores/categories/${categoryKey}/brands`,
        { name: newName.trim(), description: newDesc.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewName("");
      setNewDesc("");
      setShowAdd(false);
      fetchBrands();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to add brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/stores/categories/${categoryKey}/brands/${brand.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDeleteTarget(null);
      fetchBrands();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete brand");
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

      <div className="stores-main-content">
        {/* Page header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "2.8rem" }}>{meta.icon}</span>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#222",
                }}
              >
                {meta.label}
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#888",
                  fontSize: "0.95rem",
                }}
              >
                {brands.length} brand{brands.length !== 1 ? "s" : ""} · Select a
                brand to view inventory
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-add-item" onClick={() => setShowAdd(true)}>
              + Add Brand
            </button>
            <button
              className="btn-search"
              onClick={() => navigate("/stores")}
              style={{ padding: "10px 18px" }}
            >
              ← Categories
            </button>
          </div>
        </div>

        {/* Add Brand inline form */}
        {showAdd && (
          <div
            style={{
              background: "#f8f9ff",
              border: "2px solid #667eea",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 200px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#555",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                Brand Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Copeland, Danfoss, Schneider..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1.5px solid #ddd",
                  borderRadius: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: "2 1 300px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#555",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                Description (optional)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1.5px solid #ddd",
                  borderRadius: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-save"
                onClick={handleAddBrand}
                disabled={saving}
                style={{ padding: "10px 20px" }}
              >
                {saving ? "⏳ Saving..." : "✓ Add"}
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                  setNewDesc("");
                }}
                style={{ padding: "10px 16px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Brands grid */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#999",
              fontSize: "1.1rem",
            }}
          >
            Loading brands...
          </div>
        ) : brands.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 20px", color: "#999" }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🏷️</div>
            <h3 style={{ color: "#666", marginBottom: "8px" }}>
              No brands yet
            </h3>
            <p style={{ marginBottom: "20px" }}>
              Add the first brand for this category
            </p>
            <button className="btn-add-item" onClick={() => setShowAdd(true)}>
              + Add First Brand
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "18px",
            }}
          >
            {brands.map((brand) => (
              <div
                key={brand.id}
                style={{
                  background: "white",
                  border: "2px solid #f0f0f0",
                  borderRadius: "14px",
                  padding: "22px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    meta.color;
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-3px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 18px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#f0f0f0";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 6px rgba(0,0,0,0.05)";
                }}
                onClick={() => navigate(`/stores/${categoryKey}/${brand.id}`)}
              >
                {/* Admin delete button */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(brand);
                    }}
                    title="Delete brand"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      opacity: 0.5,
                      transition: "opacity 0.2s",
                      padding: "4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = "0.5")
                    }
                  >
                    🗑️
                  </button>
                )}

                {/* Brand icon & name */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: meta.color + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    marginBottom: "12px",
                  }}
                >
                  🏷️
                </div>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#222",
                    paddingRight: "24px",
                  }}
                >
                  {brand.name}
                </h3>
                {brand.description && (
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "0.85rem",
                      color: "#777",
                      lineHeight: 1.4,
                    }}
                  >
                    {brand.description}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: meta.color,
                      background: meta.color + "18",
                      padding: "3px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {brand.item_count} item{brand.item_count !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: "12px", color: "#aaa" }}>
                    View inventory →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🗑️ Delete Brand</h2>
              <button
                className="close-button"
                onClick={() => setDeleteTarget(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the brand{" "}
                <strong>"{deleteTarget.name}"</strong>?
              </p>
              {Number(deleteTarget.item_count) > 0 && (
                <p
                  style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "#fff3e0",
                    borderRadius: "6px",
                    color: "#e65100",
                    fontSize: "0.9rem",
                  }}
                >
                  ⚠️ This brand has{" "}
                  <strong>
                    {deleteTarget.item_count} inventory item
                    {deleteTarget.item_count !== 1 ? "s" : ""}
                  </strong>
                  . Deleting the brand will unlink those items.
                </p>
              )}
              <p
                style={{
                  color: "#f44336",
                  marginTop: "10px",
                  fontSize: "0.88rem",
                }}
              >
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={() => handleDelete(deleteTarget)}
                style={{ background: "#f44336" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreBrands;

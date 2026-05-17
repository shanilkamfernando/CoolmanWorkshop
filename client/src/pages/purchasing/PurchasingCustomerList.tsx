// ============================================
// Purchasing Customer Portal - Customer List
// Save as: client/src/pages/purchasing/PurchasingCustomerPortal.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "../customers/ProjectDashboard.css";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PurchasingCustomer {
  id: number;
  name: string;
  contact_number: string;
  email: string;
  address: string;
  created_by: string;
  created_at: string;
}

const getInitials = (name: string) => {
  const w = name.trim().split(" ");
  return w.length === 1
    ? w[0].substring(0, 2).toUpperCase()
    : (w[0][0] + w[w.length - 1][0]).toUpperCase();
};

const getColor = (name: string) => {
  const colors = [
    "#667eea",
    "#2196F3",
    "#4CAF50",
    "#FF9800",
    "#E91E63",
    "#00BCD4",
    "#9C27B0",
    "#FF5722",
    "#009688",
    "#3F51B5",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

const PurchasingCustomerList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<PurchasingCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PurchasingCustomer | null>(
    null,
  );

  const isAdmin = user?.role === "admin";
  const token = () => localStorage.getItem("token");
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/purchasing/customers",
        { headers: headers() },
      );
      setCustomers(res.data.customers || []);
    } catch (e) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert("Customer name is required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        "http://localhost:5000/api/purchasing/customers",
        // "http://localhost:5000/api/purchasing/customers",
        {
          name: newName.trim(),
          contact_number: newContact,
          email: newEmail,
          address: newAddress,
        },
        { headers: headers() },
      );
      setNewName("");
      setNewContact("");
      setNewEmail("");
      setNewAddress("");
      setShowAdd(false);
      fetchCustomers();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to add customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: PurchasingCustomer) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/purchasing/customers/${customer.id}`,
        // `http://localhost:5000/api/purchasing/customers/${customer.id}`,
        { headers: headers() },
      );
      setDeleteTarget(null);
      fetchCustomers();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete customer");
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_number || "").includes(search),
  );

  return (
    <div className="project-dashboard">
      {/* Header */}
      <div className="portal-header">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => navigate("/dashboard")}
          >
            <img src={companyLogo} alt="Logo" className="company-logo" />
          </div>
          <h1 className="portal-title" onClick={() => navigate("/dashboard")}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span
            style={{
              background: "#667eea",
              color: "#fff",
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            🛒 Purchasing
          </span>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      <div className="project-main-content">
        {/* Page header */}
        <div className="project-header-row">
          <div>
            <h2 style={{ margin: 0 }}>Customers</h2>
            <p style={{ color: "#888", fontSize: "0.9rem", marginTop: "4px" }}>
              {filtered.length} customer{filtered.length !== 1 ? "s" : ""} ·
              Select a customer to view operations
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-add-small" onClick={() => setShowAdd(true)}>
              + Add Customer
            </button>
            <button
              className="btn-back"
              onClick={() => navigate("/purchasing")}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="🔍 Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 16px",
              fontSize: "0.95rem",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "400px",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        {/* Add Customer Form */}
        {showAdd && (
          <div
            style={{
              background: "#f8f9ff",
              border: "2px solid #667eea",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#333",
              }}
            >
              New Purchasing Customer
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              {[
                {
                  label: "Customer Name *",
                  value: newName,
                  onChange: setNewName,
                  placeholder: "Full name",
                },
                {
                  label: "Contact Number",
                  value: newContact,
                  onChange: setNewContact,
                  placeholder: "Phone number",
                },
                {
                  label: "Email",
                  value: newEmail,
                  onChange: setNewEmail,
                  placeholder: "Email address",
                },
                {
                  label: "Address",
                  value: newAddress,
                  onChange: setNewAddress,
                  placeholder: "Address",
                },
              ].map((f) => (
                <div key={f.label}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#555",
                      marginBottom: "5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      fontSize: "14px",
                      border: "1.5px solid #ddd",
                      borderRadius: "6px",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-save-project"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "✓ Add Customer"}
              </button>
              <button
                className="btn-cancel-meeting"
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                  setNewContact("");
                  setNewEmail("");
                  setNewAddress("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Customer Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 20px", color: "#999" }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛒</div>
            <h3 style={{ color: "#666", marginBottom: "8px" }}>
              {search ? "No customers match" : "No customers yet"}
            </h3>
            {!search && (
              <button
                className="btn-add-small"
                onClick={() => setShowAdd(true)}
              >
                + Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filtered.map((customer) => {
              const initials = getInitials(customer.name);
              const color = getColor(customer.name);
              return (
                <div
                  key={customer.id}
                  style={{
                    background: "white",
                    border: "2px solid #f0f0f0",
                    borderRadius: "14px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = color;
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
                  onClick={() =>
                    navigate(`/purchasing/customers/${customer.id}/dashboard`, {
                      state: { customer },
                    })
                  }
                >
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(customer);
                      }}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        opacity: 0.4,
                        transition: "opacity 0.2s",
                        padding: "4px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.4")
                      }
                    >
                      🗑️
                    </button>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#222",
                          paddingRight: "28px",
                        }}
                      >
                        {customer.name}
                      </h3>
                      {customer.contact_number && (
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "0.85rem",
                            color: "#888",
                          }}
                        >
                          📞 {customer.contact_number}
                        </p>
                      )}
                    </div>
                  </div>
                  {customer.email && (
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: "0.83rem",
                        color: "#999",
                      }}
                    >
                      ✉️ {customer.email}
                    </p>
                  )}
                  {customer.address && (
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: "0.83rem",
                        color: "#999",
                      }}
                    >
                      📍 {customer.address}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#aaa" }}>
                      View operations →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🗑️ Delete Customer</h2>
              <button
                className="close-button"
                onClick={() => setDeleteTarget(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>"{deleteTarget.name}"</strong>?
              </p>
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

export default PurchasingCustomerList;

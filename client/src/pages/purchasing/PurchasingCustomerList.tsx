// ============================================
// Purchasing Customer Portal - Customer List
// Replace: client/src/pages/purchasing/PurchasingCustomerPortal.tsx
// UI matches the main CustomerList (same CSS classes) + search bar
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../customers/Customers.css";
import AppHeader from "../../components/AppHeader";

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

const API =
  "https://coolmanworkshop-production.up.railway.app/api/purchasing/customers";

const getInitials = (name: string): string => {
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getColorFromName = (name: string): string => {
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
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const PurchasingCustomerList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<PurchasingCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PurchasingCustomer | null>(
    null,
  );

  const isAdmin = user?.role === "admin";
  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, { headers: headers() });
      setCustomers(res.data.customers || []);
    } catch (e) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewContact("");
    setNewEmail("");
    setNewAddress("");
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert("Customer name is required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        API,
        {
          name: newName.trim(),
          contact_number: newContact,
          email: newEmail,
          address: newAddress,
        },
        { headers: headers() },
      );
      closeAddModal();
      fetchCustomers();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to add customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: PurchasingCustomer) => {
    try {
      await axios.delete(`${API}/${customer.id}`, { headers: headers() });
      setDeleteTarget(null);
      fetchCustomers();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete customer");
    }
  };

  const handleCustomerClick = (customer: PurchasingCustomer) => {
    navigate(`/purchasing/customers/${customer.id}/projects`, {
      state: { customer: { id: customer.id, name: customer.name } },
    });
  };

  const term = search.trim().toLowerCase();
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      (c.contact_number || "").includes(search.trim()) ||
      (c.email || "").toLowerCase().includes(term),
  );

  return (
    <div className="customer-portal">
      <AppHeader />

      <div className="main-content-full">
        {/* Page header */}
        <div className="page-header-row">
          <h2>Customers</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="btn-add-customer"
              onClick={() => setShowAddModal(true)}
            >
              + Add Customer
            </button>
            <button
              className="btn-cancel"
              onClick={() => navigate("/purchasing")}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Search bar */}
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
              background: "#fff",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        {/* Customer grid */}
        {loading ? (
          <div className="loading-center">Loading customers...</div>
        ) : (
          <div className="customers-grid">
            {filtered.map((customer) => {
              const initials = getInitials(customer.name);
              const color = getColorFromName(customer.name);

              return (
                <div
                  key={customer.id}
                  className="customer-card"
                  onClick={() => handleCustomerClick(customer)}
                  style={{ position: "relative" }}
                >
                  {isAdmin && (
                    <button
                      className="card-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(customer);
                      }}
                      title="Delete customer (Admin only)"
                    >
                      🗑️
                    </button>
                  )}
                  <div
                    className="customer-logo"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <h3 className="customer-name">{customer.name}</h3>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <p>
              {search ? "No customers match your search" : "No customers found"}
            </p>
            {!search && (
              <button
                className="btn-add-customer"
                onClick={() => setShowAddModal(true)}
              >
                + Add Your First Customer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="close-button" onClick={closeAddModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="Phone number"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email address"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Address"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeAddModal}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? "Saving..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Customer</h2>
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
                <strong>{deleteTarget.name}</strong>?
              </p>
              <p style={{ color: "#f44336", marginTop: "10px" }}>
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

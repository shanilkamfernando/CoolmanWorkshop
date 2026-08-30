// ============================================
// Customer List - Final version with logo generation
// Replace: client/src/pages/customers/CustomerList.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Customers.css";
import companyLogo from "../../assets/mainlogo.png";
import AppHeader from "../../components/AppHeader";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Customer {
  id: number;
  name: string;
  created_at: string;
}

const CustomerList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchCustomers();
  }, []);

  // Generate initials from customer name
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Generate color from name (consistent color for same name)
  const getColorFromName = (name: string): string => {
    const colors = [
      "#667eea", // Purple
      "#2196F3", // Blue
      "#4CAF50", // Green
      "#FF9800", // Orange
      "#E91E63", // Pink
      "#00BCD4", // Cyan
      "#9C27B0", // Purple
      "#FF5722", // Deep Orange
      "#009688", // Teal
      "#3F51B5", // Indigo
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://coolmanworkshop-production.up.railway.app/api/customers",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      // Demo data
      setCustomers([
        { id: 1, name: "ABC Refrigeration Ltd", created_at: "2024-01-15" },
        { id: 2, name: "XYZ Cold Storage", created_at: "2024-02-01" },
        { id: 3, name: "Cool Systems Inc", created_at: "2024-02-10" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleCustomerClick = (customer: Customer) => {
    navigate(`/customers/${customer.id}`, { state: { customer } });
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/customers",
        { name: newCustomerName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("Customer added successfully!");
        setShowAddModal(false);
        setNewCustomerName("");
        fetchCustomers();
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      // Demo mode - add to local state
      const mockCustomer: Customer = {
        id: Date.now(),
        name: newCustomerName,
        created_at: new Date().toISOString(),
      };
      setCustomers([...customers, mockCustomer]);
      setShowAddModal(false);
      setNewCustomerName("");
      alert("Customer added successfully!");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert("Only admins can delete customers");
      return;
    }
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Customer deleted successfully!");
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      alert("Customer deleted!");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="customer-portal">
      {/* Header */}
      {/* <div className="portal-header">
        <div className="header-left">
          <div className="logo-container" onClick={handleBackToDashboard}>
            <img
              src={companyLogo}
              alt="Company Logo"
              className="company-logo"
            />
          </div>
          <h1 className="portal-title" onClick={handleBackToDashboard}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div> */}
      <AppHeader />

      {/* Main Content */}
      <div className="main-content-full">
        <div className="page-header-row">
          <h2>Customers</h2>
          {isAdmin && (
            <button
              className="btn-add-customer"
              onClick={() => setShowAddModal(true)}
            >
              + Add Customer
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-center">Loading customers...</div>
        ) : (
          <div className="customers-grid">
            {customers.map((customer) => {
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
                      onClick={(e) => handleDeleteClick(e, customer)}
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

        {!loading && customers.length === 0 && (
          <div className="empty-state">
            <p>No customers found</p>
            {isAdmin && (
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
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
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
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="ABC Refrigeration Ltd"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCustomer();
                    }
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddCustomer}>
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Customer</h2>
              <button
                className="close-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{customerToDelete.name}</strong>?
              </p>
              <p style={{ color: "#f44336", marginTop: "10px" }}>
                This will also delete all associated projects and data.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleConfirmDelete}
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

export default CustomerList;

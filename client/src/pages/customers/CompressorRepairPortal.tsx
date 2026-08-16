// ============================================
// Compressor Repair Portal - Company Selection
// Save as: client/src/pages/customers/CompressorRepairPortal.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./Customers.css";
import companyLogo from "../../assets/mainlogo.jpeg";
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
}

interface RepairCompany {
  id: number;
  name: string;
  customerId: number;
  created_at: string;
}

const CompressorRepairPortal = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [repairCompanies, setRepairCompanies] = useState<RepairCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<RepairCompany | null>(
    null,
  );

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (location.state?.customer) {
      setCustomer(location.state.customer);
    } else {
      fetchCustomer();
    }

    fetchRepairCompanies();
  }, [customerId, location]);

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.customer) {
        setCustomer(response.data.customer);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

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

  const fetchRepairCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-repair`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRepairCompanies(response.data.companies || []);
    } catch (error) {
      console.error("Error fetching repair companies:", error);
      setRepairCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleBackToCustomer = () => {
    navigate(`/customers/${customerId}`, { state: { customer } });
  };

  const handleCompanyClick = (company: RepairCompany) => {
    navigate(`/customers/${customerId}/compressor-repair/${company.id}`, {
      state: { customer, company },
    });
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      alert("Repair company name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-repair`,
        { name: newCompanyName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("Repair company added successfully!");
        setShowAddModal(false);
        setNewCompanyName("");
        fetchRepairCompanies();
      }
    } catch (error) {
      console.error("Error adding repair company:", error);
      alert("Failed to add repair company");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, company: RepairCompany) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert("Only admins can delete repair companies");
      return;
    }
    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-repair/${companyToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Repair company deleted successfully!");
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      fetchRepairCompanies();
    } catch (error) {
      console.error("Error deleting repair company:", error);
      alert("Failed to delete repair company");
    }
  };

  const isAdmin = user?.role === "admin";

  if (!customer) {
    return <div className="loading-center">Loading...</div>;
  }

  const initials = getInitials(customer.name);
  const color = getColorFromName(customer.name);

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
          <div className="customer-logo-badge-with-icon">
            <div
              className="customer-badge-logo"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
            <span className="customer-logo-text">{customer.name}</span>
          </div>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div> */}
      <AppHeader />

      {/* Main Content */}
      <div className="main-content-full">
        <div className="page-header-row">
          <div>
            <h2>Compressor Repair</h2>
            <p style={{ color: "#666", marginTop: "8px", fontSize: "1rem" }}>
              {customer.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-back" onClick={handleBackToCustomer}>
              ← Back
            </button>
            {isAdmin && (
              <button
                className="btn-add-customer"
                onClick={() => setShowAddModal(true)}
              >
                + Add Repair Company
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-center">Loading repair companies...</div>
        ) : (
          <div className="customers-grid">
            {repairCompanies.map((company) => (
              <div
                key={company.id}
                className="customer-card"
                onClick={() => handleCompanyClick(company)}
                style={{ position: "relative" }}
              >
                {isAdmin && (
                  <button
                    className="card-delete-btn"
                    onClick={(e) => handleDeleteClick(e, company)}
                    title="Delete company (Admin only)"
                  >
                    🗑️
                  </button>
                )}
                <div
                  className="customer-logo"
                  style={{ backgroundColor: "#d3d3d3" }}
                >
                  ⚙️
                </div>
                <h3 className="customer-name">{company.name}</h3>
              </div>
            ))}
          </div>
        )}

        {!loading && repairCompanies.length === 0 && (
          <div className="empty-state">
            <p>No repair companies found</p>
            {isAdmin && (
              <button
                className="btn-add-customer"
                onClick={() => setShowAddModal(true)}
              >
                + Add Your First Repair Company
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Repair Company Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add Repair Company</h2>
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
                  Repair Company Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="ABC Compressor Repair"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCompany();
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
              <button className="btn-save" onClick={handleAddCompany}>
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && companyToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Repair Company</h2>
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
                <strong>{companyToDelete.name}</strong>?
              </p>
              <p style={{ color: "#f44336", marginTop: "10px" }}>
                This will delete all associated repair data. This action cannot
                be undone.
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

export default CompressorRepairPortal;

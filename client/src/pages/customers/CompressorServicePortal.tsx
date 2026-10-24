// ============================================
// Compressor Service List - Company Selection Portal
// Save as: client/src/pages/customers/CompressorServicePortal.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
}

interface ServiceCompany {
  id: number;
  name: string;
  model?: string;
  serial_number?: string;
  unit?: string;
  customerId: number;
  created_at: string;
}

const CompressorServicePortal = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [serviceCompanies, setServiceCompanies] = useState<ServiceCompany[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    model: "",
    serial_number: "",
    unit: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<ServiceCompany | null>(
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

    fetchServiceCompanies();
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
      const demoCustomers = [
        { id: 1, name: "ABC Refrigeration Ltd" },
        { id: 2, name: "XYZ Cold Storage" },
        { id: 3, name: "Cool Systems Inc" },
        { id: 4, name: "testing" },
      ];
      const found = demoCustomers.find((c) => c.id === Number(customerId));
      setCustomer(
        found || {
          id: Number(customerId),
          name: "Customer " + customerId,
        },
      );
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

  const fetchServiceCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setServiceCompanies(response.data.companies || []);
    } catch (error) {
      console.error("Error fetching service companies:", error);
      // Demo data
      setServiceCompanies([
        {
          id: 1,
          name: "Carrier Service Center",
          model: "30XA-502",
          serial_number: "CR-2024-1188",
          unit: "Unit 1",
          customerId: Number(customerId),
          created_at: "2024-01-15",
        },
        {
          id: 2,
          name: "Trane Compressor Service",
          model: "RTAC-140",
          serial_number: "TR-2024-0345",
          unit: "Unit 2",
          customerId: Number(customerId),
          created_at: "2024-02-01",
        },
        {
          id: 3,
          name: "Copeland Service Hub",
          model: "ZR144KC",
          serial_number: "CP-2024-0912",
          unit: "Unit 3",
          customerId: Number(customerId),
          created_at: "2024-02-10",
        },
      ]);
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

  const handleCompanyClick = (company: ServiceCompany) => {
    navigate(`/customers/${customerId}/compressor-service/${company.id}`, {
      state: { customer, company },
    });
  };

  const resetNewCompanyForm = () =>
    setNewCompany({ name: "", model: "", serial_number: "", unit: "" });

  const handleAddCompany = async () => {
    if (!newCompany.name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service`,
        newCompany,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("Added successfully!");
        setShowAddModal(false);
        resetNewCompanyForm();
        fetchServiceCompanies();
      }
    } catch (error) {
      console.error("Error adding service company:", error);
      const mockCompany: ServiceCompany = {
        id: Date.now(),
        name: newCompany.name,
        model: newCompany.model,
        serial_number: newCompany.serial_number,
        unit: newCompany.unit,
        customerId: Number(customerId),
        created_at: new Date().toISOString(),
      };
      setServiceCompanies([...serviceCompanies, mockCompany]);
      setShowAddModal(false);
      resetNewCompanyForm();
      alert("Added successfully!");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, company: ServiceCompany) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert("Only admins can delete service companies");
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
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Service company deleted successfully!");
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      fetchServiceCompanies();
    } catch (error) {
      console.error("Error deleting service company:", error);
      // For demo mode
      setServiceCompanies(
        serviceCompanies.filter((c) => c.id !== companyToDelete.id),
      );
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      alert("Service company deleted!");
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
            <h2>Compressor Service</h2>
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
                + Add Service Company
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-center">Loading service companies...</div>
        ) : (
          <div className="customers-grid">
            {serviceCompanies.map((company) => (
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
                  🔧
                </div>
                <h3 className="customer-name">{company.name}</h3>
                {(company.model || company.serial_number || company.unit) && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "0.8rem",
                      color: "#777",
                      lineHeight: 1.6,
                    }}
                  >
                    {company.model && <div>Model: {company.model}</div>}
                    {company.serial_number && (
                      <div>Serial No: {company.serial_number}</div>
                    )}
                    {company.unit && <div>Unit: {company.unit}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && serviceCompanies.length === 0 && (
          <div className="empty-state">
            <p>No service companies found</p>
            {isAdmin && (
              <button
                className="btn-add-customer"
                onClick={() => setShowAddModal(true)}
              >
                + Add Your First Service Company
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Service Company Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            resetNewCompanyForm();
          }}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add Service Company</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowAddModal(false);
                  resetNewCompanyForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  placeholder="Carrier Service Center"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCompany();
                    }
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginTop: "14px",
                }}
              >
                <div className="form-group">
                  <label>Compressor Model</label>
                  <input
                    type="text"
                    value={newCompany.model}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, model: e.target.value })
                    }
                    placeholder="e.g. 30XA-502"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddCompany();
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    type="text"
                    value={newCompany.serial_number}
                    onChange={(e) =>
                      setNewCompany({
                        ...newCompany,
                        serial_number: e.target.value,
                      })
                    }
                    placeholder="e.g. CR-2024-1188"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddCompany();
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "14px" }}>
                <label>Unit</label>
                <input
                  type="text"
                  value={newCompany.unit}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, unit: e.target.value })
                  }
                  placeholder="e.g. Unit 1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddCompany();
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowAddModal(false);
                  resetNewCompanyForm();
                }}
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
              <h2>Delete Service Company</h2>
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
                This action cannot be undone.
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

export default CompressorServicePortal;

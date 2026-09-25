// ============================================
// Purchasing Projects Portal — projects for one customer
// Save as: client/src/pages/purchasing/PurchasingProjectsPortal.tsx
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "../customers/Customers.css";
import AppHeader from "../../components/AppHeader";

interface Customer {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

const API = "https://coolmanworkshop-production.up.railway.app/api";

const PurchasingProjectsPortal = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();

  const [customer, setCustomer] = useState<Customer | null>(
    location.state?.customer || null,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(
    !location.state?.customer,
  );
  const [user, setUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const getHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    [],
  );

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    setCustomerLoading(true);
    try {
      // Fixed: prefixed with /purchasing
      const res = await axios.get(`${API}/purchasing/customers/${customerId}`, {
        headers: getHeaders(),
      });
      if (res.data?.customer) {
        setCustomer(res.data.customer);
      }
    } catch (error) {
      console.error("Failed to fetch customer details:", error);
    } finally {
      setCustomerLoading(false);
    }
  }, [customerId, getHeaders]);

  const fetchProjects = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      // Fixed: prefixed with /purchasing
      const res = await axios.get(
        `${API}/purchasing/customers/${customerId}/projects`,
        {
          headers: getHeaders(),
        },
      );
      setProjects(res.data?.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, getHeaders]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Failed to parse user data from localStorage", err);
      }
    }

    if (!customer) {
      fetchCustomer();
    }
    fetchProjects();
  }, [customerId, customer, fetchCustomer, fetchProjects]);

  const isAdmin = user?.role === "admin";

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      // Fixed: prefixed with /purchasing
      await axios.post(
        `${API}/purchasing/customers/${customerId}/projects`,
        { name: newProjectName.trim() },
        { headers: getHeaders() },
      );

      alert("Project added successfully!");
      setShowAddModal(false);
      setNewProjectName("");
      fetchProjects();
    } catch (error: unknown) {
      console.error("Error adding project:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || "Failed to add project");
      } else {
        alert("Failed to add project");
      }
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/purchasing/customers/${customerId}/dashboard`, {
      state: { customer, project },
    });
  };

  if (customerLoading) {
    return <div className="loading-center">Loading customer data...</div>;
  }

  if (!customer) {
    return (
      <div className="customer-portal">
        <AppHeader />
        <div className="main-content-full">
          <div className="empty-state">
            <p>Customer not found.</p>
            <button
              className="btn-back"
              onClick={() => navigate("/purchasing/customer-list")}
            >
              ← Back to Customer List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-portal">
      <AppHeader />
      <div className="main-content-full">
        <div className="page-header-row">
          <div>
            <h2>Projects</h2>
            <p style={{ color: "#666", marginTop: "8px" }}>{customer.name}</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn-back"
              onClick={() => navigate("/purchasing/customer-list")}
            >
              ← Back
            </button>

            {isAdmin && (
              <button
                className="btn-add-customer"
                onClick={() => setShowAddModal(true)}
              >
                + Add Project
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-center">Loading projects...</div>
        ) : (
          <div className="customers-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="customer-card"
                onClick={() => handleProjectClick(project)}
              >
                <div
                  className="customer-logo"
                  style={{ backgroundColor: "#d3d3d3" }}
                >
                  📋
                </div>
                <h3 className="customer-name">{project.name}</h3>
              </div>
            ))}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="empty-state">
            <p>No projects found for this customer.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add New Project</h2>

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
                  Project Name <span className="required">*</span>
                </label>

                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddProject();
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

              <button className="btn-save" onClick={handleAddProject}>
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasingProjectsPortal;

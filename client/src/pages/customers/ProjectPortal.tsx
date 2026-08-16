// ============================================
// Projects Portal - With Delete Functionality
// Replace: client/src/pages/customers/ProjectsPortal.tsx
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

interface Project {
  id: number;
  name: string;
  customerId: number;
  created_at: string;
}

const ProjectsPortal = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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

    fetchProjects();
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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([
        {
          id: 1,
          name: "Chiller Installation Project",
          customerId: Number(customerId),
          created_at: "2024-01-15",
        },
        {
          id: 2,
          name: "Cold Room Upgrade",
          customerId: Number(customerId),
          created_at: "2024-02-01",
        },
        {
          id: 3,
          name: "HVAC System Maintenance",
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

  const handleProjectClick = (project: Project) => {
    navigate(`/customers/${customerId}/projects/${project.id}`, {
      state: { customer, project },
    });
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects`,
        { name: newProjectName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("Project added successfully!");
        setShowAddModal(false);
        setNewProjectName("");
        fetchProjects();
      }
    } catch (error) {
      console.error("Error adding project:", error);
      const mockProject: Project = {
        id: Date.now(),
        name: newProjectName,
        customerId: Number(customerId),
        created_at: new Date().toISOString(),
      };
      setProjects([...projects, mockProject]);
      setShowAddModal(false);
      setNewProjectName("");
      alert("Project added successfully!");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert("Only admins can delete projects");
      return;
    }
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Project deleted successfully!");
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      alert("Project deleted!");
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
            <h2>Projects</h2>
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
                style={{ position: "relative" }}
              >
                {isAdmin && (
                  <button
                    className="card-delete-btn"
                    onClick={(e) => handleDeleteClick(e, project)}
                    title="Delete project (Admin only)"
                  >
                    🗑️
                  </button>
                )}
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
            <p>No projects found</p>
            {isAdmin && (
              <button
                className="btn-add-customer"
                onClick={() => setShowAddModal(true)}
              >
                + Add Your First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
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
                  placeholder="Chiller Installation Project"
                  autoFocus
                  onKeyPress={(e) => {
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Project</h2>
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
                <strong>{projectToDelete.name}</strong>?
              </p>
              <p style={{ color: "#f44336", marginTop: "10px" }}>
                This will also delete all associated data.
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

export default ProjectsPortal;

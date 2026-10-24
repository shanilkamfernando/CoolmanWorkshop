import { useState, useEffect, useCallback, useRef } from "react";
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
  unread_count?: number;
  latest_activity_at?: string | null;
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
  const [saving, setSaving] = useState(false);
  const openingProject = useRef(false);
  const getHeaders = useCallback(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    [],
  );

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    setCustomerLoading(true);
    try {
      const res = await axios.get(`${API}/purchasing/customers/${customerId}`, {
        headers: getHeaders(),
      });
      if (res.data?.customer) setCustomer(res.data.customer);
    } catch (error) {
      console.error("Failed to fetch customer details:", error);
    } finally {
      setCustomerLoading(false);
    }
  }, [customerId, getHeaders]);

  const fetchProjects = useCallback(
    async (initial = false) => {
      if (!customerId) return;
      if (initial) setLoading(true);
      try {
        const res = await axios.get(
          `${API}/purchasing/customers/${customerId}/projects`,
          { headers: getHeaders() },
        );
        setProjects(res.data?.projects || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        if (initial) setProjects([]);
      } finally {
        if (initial) setLoading(false);
      }
    },
    [customerId, getHeaders],
  );

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (err) {
        console.error("Invalid user data", err);
      }
    }
  }, []);
  useEffect(() => {
    setCustomer(location.state?.customer || null);
    if (!location.state?.customer) void fetchCustomer();
    else setCustomerLoading(false);
    void fetchProjects(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchProjects();
    }, 30000);
    const onFocus = () => {
      void fetchProjects();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [customerId, fetchCustomer, fetchProjects]);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      alert("Project name is required");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/purchasing/customers/${customerId}/projects`,
        { name: newProjectName.trim() },
        { headers: getHeaders() },
      );
      setShowAddModal(false);
      setNewProjectName("");
      await fetchProjects();
    } catch (error: unknown) {
      alert(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Failed to add project"
          : "Failed to add project",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleProjectClick = async (project: Project) => {
    if (openingProject.current || !customerId) return;
    openingProject.current = true;
    // Persist the selected project before navigation, including across page refreshes.
    sessionStorage.setItem(
      `purchasing:selected-project:${customerId}`,
      String(project.id),
    );
    // Only this project's notifications are cleared, and only for the logged-in user.
    // Do not block access if the notification endpoint is temporarily unavailable.
    try {
      await axios.post(
        `${API}/purchasing/customers/${customerId}/projects/${project.id}/notifications/read`,
        {},
        { headers: getHeaders() },
      );
    } catch (error) {
      console.error("Could not mark project notifications as read:", error);
    } finally {
      openingProject.current = false;
      navigate(`/purchasing/customers/${customerId}/dashboard`, {
        state: { customer, project },
      });
    }
  };

  if (customerLoading)
    return <div className="loading-center">Loading customer data...</div>;
  if (!customer)
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

  return (
    <div className="customer-portal">
      <AppHeader />
      <div className="main-content-full">
        <div className="page-header-row">
          <div>
            <h2>Projects</h2>
            <p style={{ color: "#666", marginTop: 8 }}>{customer.name}</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn-back"
              onClick={() => navigate("/purchasing/customer-list")}
            >
              ← Back
            </button>
            {user?.role === "admin" && (
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
            {projects.map((project) => {
              const unread = Math.max(0, Number(project.unread_count) || 0);
              return (
                <div
                  key={project.id}
                  className="customer-card"
                  onClick={() => void handleProjectClick(project)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleProjectClick(project);
                    }
                  }}
                  style={{ position: "relative", cursor: "pointer" }}
                >
                  {unread > 0 && (
                    <span
                      title={`${unread} unread project updates`}
                      aria-label={`${unread} unread project updates`}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                        minWidth: 23,
                        height: 23,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: "#dc2626",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        boxShadow: "0 2px 6px rgba(220,38,38,.25)",
                      }}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                  <div
                    className="customer-logo"
                    style={{ backgroundColor: "#d3d3d3" }}
                  >
                    📋
                  </div>
                  <h3 className="customer-name">{project.name}</h3>
                </div>
              );
            })}
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
                    if (e.key === "Enter") void handleAddProject();
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
              <button
                className="btn-save"
                disabled={saving}
                onClick={() => void handleAddProject()}
              >
                {saving ? "Saving..." : "Add Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PurchasingProjectsPortal;

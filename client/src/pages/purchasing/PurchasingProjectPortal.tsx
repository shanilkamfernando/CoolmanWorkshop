// ============================================
// Purchasing Projects Portal — projects for one customer
// Save as: client/src/pages/purchasing/PurchasingProjectsPortal.tsx
// ============================================

import { useState, useEffect } from "react";
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

const API = "https://coolmanworkshop-production.up.railway.app/api";

const PurchasingProjectsPortal = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const [customer, setCustomer] = useState<Customer | null>(
    location.state?.customer || null,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    if (!customer) fetchCustomer();
    fetchProjects();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const res = await axios.get(`${API}/customers/${customerId}`, {
        headers: headers(),
      });
      if (res.data.customer) setCustomer(res.data.customer);
    } catch {}
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/customers/${customerId}/projects`, {
        headers: headers(),
      });
      setProjects(res.data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/purchasing/customers/${customerId}/dashboard`, {
      state: { customer, project },
    });
  };

  if (!customer) return <div className="loading-center">Loading...</div>;

  return (
    <div className="customer-portal">
      <AppHeader />
      <div className="main-content-full">
        <div className="page-header-row">
          <div>
            <h2>Projects</h2>
            <p style={{ color: "#666", marginTop: "8px" }}>{customer.name}</p>
          </div>
          <button
            className="btn-back"
            onClick={() => navigate("/purchasing/customer-list")}
          >
            ← Back
          </button>
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
    </div>
  );
};

export default PurchasingProjectsPortal;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jobAssignedImage from "../assets/jobAssigned.jpeg";
import "./Dashboard.css";

type PortalId =
  | "customers"
  | "purchasing"
  | "stores"
  | "workshop"
  | "documents"
  | "jobAssigned"
  | "myTasks"
  | "meetings"
  | "followup"
  | "staff";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  permissions: { portals: PortalId[] };
}

interface Portal {
  id: PortalId;
  label: string;
  icon: string;
  path: string;
  description: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        navigate("/signin");
      }
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const portals: Portal[] = [
    {
      id: "jobAssigned",
      label: "Job Assigned",
      icon: "⏱️",
      path: "/jobAssigned",
      description: "Task management",
    },
    {
      id: "purchasing",
      label: "Purchasing",
      icon: "🚚",
      path: "/purchasing",
      description: "Handle procurement and orders",
    },
    {
      id: "customers",
      label: "Customers",
      icon: "👥",
      path: "/customers",
      description: "Manage customer information",
    },
    {
      id: "workshop",
      label: "Workshop",
      icon: "🔧",
      path: "/workshop",
      description: "Workshop management",
    },
    {
      id: "stores",
      label: "Stores",
      icon: "🏪",
      path: "/stores",
      description: "Manage store locations",
    },
    {
      id: "meetings",
      label: "Meetings",
      icon: "👨‍💼",
      path: "/meetings",
      description: "Schedule and track meetings",
    },
    {
      id: "documents",
      label: "Documents",
      icon: "📄",
      path: "/documents",
      description: "Document management",
    },
  ];

  const hasPortalAccess = (portalId: PortalId): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.portals?.includes(portalId) ?? false;
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">
                {user.role === "admin" && "👑 "}
                {user.firstName} {user.lastName}
              </span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back, {user.firstName}! 👋</h2>
          <p>Select a portal to get started</p>
        </div>
        <div className="portal-grid">
          {portals.map((portal) => {
            const hasAccess = hasPortalAccess(portal.id);
            const isJobAssigned = portal.id === "jobAssigned";
            return (
              <div
                key={portal.id}
                className={`portal-tile ${isJobAssigned ? "job-assigned-tile " : ""}${!hasAccess ? "disabled" : ""}`}
                role="button"
                aria-label={portal.label}
                aria-disabled={!hasAccess}
                tabIndex={hasAccess ? 0 : -1}
                onClick={() => hasAccess && navigate(portal.path)}
                onKeyDown={(e) => {
                  if (hasAccess && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    navigate(portal.path);
                  }
                }}
              >
                {isJobAssigned ? (
                  <img
                    className="job-assigned-tile-image"
                    src={jobAssignedImage}
                    alt=""
                  />
                ) : (
                  <>
                    <div className="portal-icon">{portal.icon}</div>
                    <h3>{portal.label}</h3>
                    <p>{portal.description}</p>
                  </>
                )}
                {!hasAccess && (
                  <div className="no-access-badge">🔒 No Access</div>
                )}
              </div>
            );
          })}
          {user.role === "admin" && (
            <div
              className="portal-tile admin-tile"
              onClick={() => navigate("/users")}
            >
              <div className="portal-icon">⚙️</div>
              <h3>User Management</h3>
              <p>Manage users and permissions</p>
              <div className="admin-badge">Admin Only</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

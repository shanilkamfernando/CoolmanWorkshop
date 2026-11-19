import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import purchasing from "../../assets/purchasing.jpeg";
import customers from "../../assets/customers.jpeg";
import workshop from "../../assets/workshop.jpeg";
import stores from "../../assets/stores.jpeg";
import meetings from "../../assets/meetings.jpeg";
import documents from "../../assets/documents.jpeg";

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
  permissions: {
    portals: PortalId[];
  };
}

interface Portal {
  id: PortalId;
  label: string;
  image: string;
  path: string;
  description: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Load logged-in user
  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("user");
        navigate("/signin");
      }
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  // Main dashboard portals
  const portals: Portal[] = [
    {
      id: "purchasing",
      label: "Purchasing",
      image: purchasing,
      path: "/purchasing",
      description: "Handle procurement and orders",
    },
    {
      id: "customers",
      label: "Customers",
      image: customers,
      path: "/customers",
      description: "Manage customer information",
    },
    {
      id: "workshop",
      label: "Workshop",
      image: workshop,
      path: "/workshop",
      description: "Workshop management",
    },
    {
      id: "stores",
      label: "Stores",
      image: stores,
      path: "/stores",
      description: "Manage store locations",
    },
    {
      id: "meetings",
      label: "Meetings",
      image: meetings,
      path: "/meetings",
      description: "Schedule and track meetings",
    },
    {
      id: "documents",
      label: "Documents",
      image: documents,
      path: "/documents",
      description: "Document management",
    },
  ];

  // Check portal permissions
  const hasPortalAccess = (portalId: PortalId): boolean => {
    if (!user) return false;

    if (user.role === "admin") return true;

    return user.permissions?.portals?.includes(portalId) ?? false;
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* ================= HEADER ================= */}

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

      {/* ================= MAIN CONTENT ================= */}

      <div className="dashboard-content">
        {/* Welcome Section */}

        <div className="welcome-section">
          <h2>Welcome back, {user.firstName}! 👋</h2>

          <p>Select a portal to get started</p>
        </div>

        {/* ================= PORTAL GRID ================= */}

        <div className="portal-grid">
          {/* Main Portals */}

          {portals.map((portal) => {
            const hasAccess = hasPortalAccess(portal.id);

            return (
              <div
                key={portal.id}
                className={`portal-tile image-tile ${
                  !hasAccess ? "disabled" : ""
                }`}
                onClick={() => hasAccess && navigate(portal.path)}
                title={portal.label}
              >
                <img
                  src={portal.image}
                  className="portal-tile-image"
                  alt={portal.label}
                />

                {!hasAccess && (
                  <div className="no-access-badge">🔒 No Access</div>
                )}
              </div>
            );
          })}

          {/* ================= MY WORKSPACE ================= */}

          <div
            className="portal-tile image-tile workspace-tile"
            onClick={() => navigate("/workspace")}
            title="My Workspace"
          >
            <img
              src={purchasing}
              className="portal-tile-image"
              alt="My Workspace"
            />

            <div className="workspace-overlay">
              <h3>My Workspace</h3>
              <p>Employee services and personal workspace</p>
            </div>
          </div>

          {/* ================= ADMIN PORTAL ================= */}

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

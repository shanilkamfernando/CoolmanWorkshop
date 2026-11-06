import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import jobAssigned from "../../assets/jobAssigned.jpeg";
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

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
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
    // {
    //   id: "myTasks",
    //   label: "My Tasks",
    //   icon: "☑️",
    //   path: "/myTasks",
    //   description: "Specific Users Task management",
    // },
    // {
    //   id: "jobAssigned",
    //   label: "Job Assigned",
    //   image: jobAssigned,
    //   path: "/jobAssigned",
    //   description: "Task management",
    // },
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

    // {
    //   id: "followup",
    //   label: "Follow Up",
    //   icon: "🔄",
    //   path: "/followup",
    //   description: "Customer follow-ups",
    // },
    // {
    //   id: "staff",
    //   label: "Staff",
    //   icon: "👤",
    //   path: "/staff",
    //   description: "Employee management",
    // },
  ];

  const profilePortals = [
    {
      id: "jobAssigned",
      label: "Job Assigned",
      description: "View and manage assigned tasks",
      path: "/jobAssigned",
      icon: "📋",
    },
    {
      id: "attendance",
      label: "Attendance",
      description: "Track employee attendance",
      path: "/attendance",
      icon: "🕒",
      adminOnly: true,
    },
    {
      id: "leave",
      label: "Leave",
      description: "Manage leave requests",
      path: "/leave",
      icon: "📅",
      adminOnly: true,
    },
    {
      id: "myDocuments",
      label: "My Documents",
      description: "Access employee documents",
      path: "/myDocuments",
      icon: "📁",
      adminOnly: true,
    },
    {
      id: "workReport",
      label: "Work Report",
      description: "View employee work reports",
      path: "/workReport",
      icon: "📊",
      adminOnly: true,
    },
  ];

  const hasPortalAccess = (portalId: PortalId): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions.portals.includes(portalId);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
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

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back, {user.firstName}! 👋</h2>
          <p>Select a portal to get started</p>
        </div>

        {/* My Profile Section */}
        <div className="profile-section">
          <div className="profile-card">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar">
                {user.firstName?.charAt(0).toUpperCase()}
                {user.lastName?.charAt(0).toUpperCase()}
              </div>

              <div className="profile-info">
                <span className="profile-label">MY PROFILE</span>
                <h2>
                  {user.firstName} {user.lastName}
                </h2>
                <p>{user.username}</p>
                <span className="profile-role">
                  {user.role === "admin" ? "Administrator" : "Employee"}
                </span>
              </div>
            </div>

            <div className="profile-divider"></div>

            {/* Profile Portals */}
            <div className="profile-portal-heading">
              <h3>My Workspace</h3>
              <p>Your personal workspace and employee services</p>
            </div>

            <div className="profile-portal-grid">
              {profilePortals.map((portal) => {
                const isAdmin = user.role === "admin";

                const hasAccess = portal.adminOnly
                  ? isAdmin
                  : portal.id === "jobAssigned"
                    ? hasPortalAccess("jobAssigned")
                    : false;

                return (
                  <div
                    key={portal.id}
                    className={`profile-portal-tile ${
                      !hasAccess ? "profile-portal-disabled" : ""
                    }`}
                    onClick={() => hasAccess && navigate(portal.path)}
                    title={
                      hasAccess
                        ? portal.label
                        : "Only administrators can access this section"
                    }
                  >
                    <div className="profile-portal-icon">{portal.icon}</div>

                    <div className="profile-portal-details">
                      <h4>{portal.label}</h4>
                      <p>{portal.description}</p>
                    </div>

                    {!hasAccess ? (
                      <span className="profile-lock">🔒</span>
                    ) : (
                      <span className="profile-arrow">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Portal Grid */}
        <div className="portal-grid">
          {portals.map((portal) => {
            const hasAccess = hasPortalAccess(portal.id);

            return (
              <div
                key={portal.id}
                className={`portal-tile ${!hasAccess ? "disabled" : ""}`}
                onClick={() => hasAccess && navigate(portal.path)}
                title={portal.label}
              >
                {/* <div className="portal-image">{portal.image}</div> */}

                <img src={portal.image} className="portal-tile-image" />

                {/* <h3>{portal.label}</h3>
                <p>{portal.description}</p> */}
                {!hasAccess && (
                  <div className="no-access-badge">🔒 No Access</div>
                )}
              </div>
            );
          })}

          {/* Admin Portal */}
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

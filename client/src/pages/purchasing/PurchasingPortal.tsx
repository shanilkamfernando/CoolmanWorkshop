// ============================================
// Purchasing Portal - Main Selection Page
// Save as: client/src/pages/purchasing/PurchasingPortal.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchasingPortal.css";
import companyLogo from "../../assets/mainlogo.jpeg";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PortalOption {
  id: number;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const PurchasingPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const portalOptions: PortalOption[] = [
    {
      id: 1,
      title: "Workshop",
      description: "Workshop management",
      icon: "⚙️",
      path: "/purchasing/workshop",
      color: "#667eea",
    },
    {
      id: 2,
      title: "Customers",
      description: "View and manage customers",
      icon: "👥",
      path: "/purchasing/customer-list",
      color: "#2196F3",
    },
    ...(user?.role === "admin" || user?.role === "data_entry"
      ? [
          {
            id: 3,
            title: "BOQ",
            description: "Bill of Quantities data entry",
            icon: "📊",
            path: "/purchasing/boq",
            color: "#0891b2",
          },
        ]
      : []),
  ];

  const handlePortalClick = (path: string) => {
    navigate(path);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="purchasing-portal">
      {/* Header */}
      <div className="portal-header">
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
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Purchasing</h2>
            <p className="page-subtitle">Select a purchasing option</p>
          </div>
          <button className="btn-back" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Portal Options Grid */}
        <div className="portals-grid">
          {portalOptions.map((option) => (
            <div
              key={option.id}
              className="portal-card"
              onClick={() => handlePortalClick(option.path)}
            >
              <div className="portal-icon" style={{ color: option.color }}>
                {option.icon}
              </div>
              <h3 className="portal-title">{option.title}</h3>
              <p className="portal-description">{option.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PurchasingPortal;

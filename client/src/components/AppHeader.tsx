import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import companyLogo from "../assets/mainlogo.jpeg";

import iconCustomers from "../assets/customers.jpeg";
import iconPurchasing from "../assets/purchasing.jpeg";
import iconStores from "../assets/stores.jpeg";
import iconWorkshop from "../assets/workshop.jpeg";
import iconDocuments from "../assets/documents.jpeg";
import iconJobAssigned from "../assets/jobassigned.jpeg";
import iconStaff from "../assets/staff.jpeg";

interface AppHeaderProps {
  customerName?: string;
}

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Crumb {
  label: string;
  icon?: string; // image src
  emoji?: string; // fallback if no image
  path: string; // where to navigate when clicked
  isCustomer?: boolean; // render as colored circle with initials
  active?: boolean; // current page (highlighted)
}

// ── Helpers ──
const getInitials = (name: string) => {
  const w = name.trim().split(" ");
  return w.length === 1
    ? w[0].substring(0, 2).toUpperCase()
    : (w[0][0] + w[w.length - 1][0]).toUpperCase();
};
const getColor = (name: string) => {
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
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

// Build the breadcrumb trail from the URL path
const buildCrumbs = (
  pathname: string,
  customerName: string,
  customerId?: string,
): Crumb[] => {
  const crumbs: Crumb[] = [];
  const seg = pathname.split("/").filter(Boolean); // e.g. ["workshop", "customers", "5", "jobcards", "12"]

  // First segment determines the portal
  const portal = seg[0];

  if (portal === "customers") {
    crumbs.push({
      label: "Customers",
      icon: iconCustomers,
      path: "/customers",
      active: seg.length === 1,
    });
    // /customers/:id/projects
    if (customerId && customerName) {
      crumbs.push({
        label: customerName,
        path: `/customers/${customerId}`,
        isCustomer: true,
        active: seg.length === 2,
      });
    }
    if (seg[2] === "projects" || seg[2] === "jobcards") {
      crumbs.push({
        label: seg[2] === "projects" ? "Projects" : "Job Cards",
        emoji: "📁",
        path: pathname,
        active: true,
      });
    }
  } else if (portal === "purchasing") {
    crumbs.push({
      label: "Purchasing",
      icon: iconPurchasing,
      path: "/purchasing",
      active: seg.length === 1,
    });
    // /purchasing/customer-list, /purchasing/customers/:id/dashboard, /purchasing/workshop/customers/:id/dashboard
    if (seg[1] === "customer-list") {
      crumbs.push({
        label: "Customers",
        emoji: "📋",
        path: "/purchasing/customer-list",
        active: true,
      });
    } else if (seg[1] === "workshop") {
      crumbs.push({
        label: "Workshop",
        icon: iconWorkshop,
        path: "/purchasing/workshop",
        active: seg.length === 2,
      });
      if (customerId && customerName) {
        crumbs.push({
          label: customerName,
          path: pathname,
          isCustomer: true,
          active: true,
        });
      }
    } else if (seg[1] === "customers" && customerId && customerName) {
      crumbs.push({
        label: customerName,
        path: pathname,
        isCustomer: true,
        active: true,
      });
    }
  } else if (portal === "workshop") {
    crumbs.push({
      label: "Workshop",
      icon: iconWorkshop,
      path: "/workshop",
      active: seg.length === 1,
    });
    // /workshop/customers, /workshop/customers/:id/jobcards, /workshop/customers/:id/jobcards/:cardId
    if (seg[1] === "customers" && customerId && customerName) {
      crumbs.push({
        label: customerName,
        path: `/workshop/customers/${customerId}/jobcards`,
        isCustomer: true,
        active: seg.length === 3,
      });
      if (seg[3] === "jobcards" && seg[4]) {
        crumbs.push({
          label: "Job Card",
          emoji: "📋",
          path: pathname,
          active: true,
        });
      }
    }
  } else if (portal === "stores") {
    crumbs.push({
      label: "Stores",
      icon: iconStores,
      path: "/stores",
      active: true,
    });
  } else if (portal === "documents") {
    crumbs.push({
      label: "Documents",
      icon: iconDocuments,
      path: "/documents",
      active: true,
    });
  } else if (portal === "jobAssigned") {
    crumbs.push({
      label: "Job Assigned",
      icon: iconJobAssigned,
      path: "/jobAssigned",
      active: true,
    });
  } else if (portal === "staff") {
    crumbs.push({
      label: "Staff",
      icon: iconStaff,
      path: "/staff",
      active: true,
    });
  } else if (portal === "meetings") {
    crumbs.push({
      label: "Meetings",
      emoji: "📅",
      path: "/meetings",
      active: true,
    });
  } else if (portal === "users") {
    crumbs.push({
      label: "User Management",
      emoji: "⚙️",
      path: "/users",
      active: true,
    });
  }

  return crumbs;
};

const AppHeader = ({ customerName: customerNameProp }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [customerName, setCustomerName] = useState<string>(
    customerNameProp || "",
  );

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (customerNameProp) {
      setCustomerName(customerNameProp);
      return;
    }
    const customerId = params.customerId;
    if (!customerId) {
      setCustomerName("");
      return;
    }

    const isWorkshopPath =
      location.pathname.startsWith("/workshop") ||
      location.pathname.startsWith("/purchasing/workshop");
    const token = localStorage.getItem("token");
    const hdr = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        if (isWorkshopPath) {
          const r = await axios.get(
            "https://coolmanworkshop-production.up.railway.app/api/workshop/customers",
            { headers: hdr },
          );
          const found = r.data.customers?.find(
            (c: any) => c.id === Number(customerId),
          );
          if (found) {
            setCustomerName(found.name);
            return;
          }
        }
        const r2 = await axios.get(
          `https://coolmanworkshop-production.up.railway.app/api/purchasing/customers/${customerId}`,
          { headers: hdr },
        );
        if (r2.data.customer) setCustomerName(r2.data.customer.name);
      } catch {}
    })();
  }, [params.customerId, location.pathname, customerNameProp]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  // On /dashboard or /signin, hide the breadcrumb trail entirely
  const isDashboard =
    location.pathname === "/dashboard" || location.pathname === "/";
  const crumbs = isDashboard
    ? []
    : buildCrumbs(location.pathname, customerName, params.customerId);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 20px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        gap: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={() => navigate("/dashboard")}
      >
        <img src={companyLogo} alt="Logo" style={{ height: "36px" }} />
        <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: "#0891b2" }}>COOL</span>
          <span style={{ color: "#111827" }}>Man</span>
          <span
            style={{ color: "#374151", marginLeft: "4px", fontWeight: 500 }}
          >
            Refrigeration
          </span>
        </h1>
      </div>

      {/* Breadcrumb trail */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginLeft: "20px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {crumbs.map((c, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {i > 0 && (
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>›</span>
            )}
            <button
              onClick={() => !c.active && navigate(c.path)}
              title={c.label}
              disabled={c.active}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "4px 10px",
                background: c.active ? "#e0f2fe" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: c.active ? "default" : "pointer",
                gap: "2px",
                borderBottom: c.active
                  ? "2px solid #0891b2"
                  : "2px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!c.active) e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (!c.active) e.currentTarget.style.background = "transparent";
              }}
            >
              {c.isCustomer ? (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: getColor(c.label),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(c.label)}
                </div>
              ) : c.icon ? (
                <img
                  src={c.icon}
                  alt={c.label}
                  style={{
                    width: "26px",
                    height: "26px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span style={{ fontSize: "22px" }}>{c.emoji}</span>
              )}
              <span
                style={{
                  fontSize: "10px",
                  color: c.active ? "#0891b2" : "#374151",
                  fontWeight: c.active ? 600 : 500,
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* User info */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          👤
        </div>
        <span style={{ fontSize: "10px", color: "#374151" }}>
          {user?.username || "User"}
        </span>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          background: "#ef4444",
          color: "#fff",
          border: "none",
          padding: "6px 14px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default AppHeader;

// ============================================
// Workshop Job Cards List
// Save as: client/src/pages/workshop/WorkshopJobCardsList.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "../stores/StoresDashboard.css";
import "../customers/ProjectDashboard.css";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}
interface WorkshopCustomer {
  id: number;
  name: string;
}
interface JobCard {
  id: number;
  job_card_number: string;
  date: string;
  item: string;
  item_number: string;
  vehicle_number: string;
  status: string;
  created_by: string;
  created_at: string;
  has_item_list: boolean;
  has_labor_sheet: boolean;
  has_grn: boolean;
  has_dispatch_note: boolean;
}

const STATUS_COLORS: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  open: { bg: "#e3f2fd", color: "#1565c0", label: "Open" },
  in_progress: { bg: "#fff8e1", color: "#e65100", label: "In Progress" },
  completed: { bg: "#e8f5e9", color: "#2e7d32", label: "Completed" },
  dispatched: { bg: "#f3e5f5", color: "#6a1b9a", label: "Dispatched" },
};

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

const WorkshopJobCardsList = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<WorkshopCustomer | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchCustomer();
    fetchJobCards();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/workshop/customers",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const found = res.data.customers?.find(
        (c: any) => c.id === Number(customerId),
      );
      if (found) setCustomer(found);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobCards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/workshop/customers/${customerId}/jobcards`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setJobCards(res.data.jobcards || []);
    } catch (e) {
      console.error(e);
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job card? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/workshop/customers/${customerId}/jobcards/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchJobCards();
    } catch {
      alert("Failed to delete job card");
    }
  };

  const filtered = jobCards.filter(
    (jc) =>
      jc.job_card_number.toLowerCase().includes(search.toLowerCase()) ||
      (jc.item || "").toLowerCase().includes(search.toLowerCase()) ||
      (jc.vehicle_number || "").toLowerCase().includes(search.toLowerCase()),
  );

  const customerName = customer?.name || "Customer";
  const initials = getInitials(customerName);
  const color = getColor(customerName);

  return (
    <div className="project-dashboard">
      {/* Header */}
      <div className="portal-header">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => navigate("/dashboard")}
          >
            <img src={companyLogo} alt="Logo" className="company-logo" />
          </div>
          <h1 className="portal-title" onClick={() => navigate("/dashboard")}>
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
            <span className="customer-logo-text">{customerName}</span>
          </div>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      <div className="project-main-content">
        <div className="project-header-row">
          <h2>🗂️ Job Cards — {customerName}</h2>
          <button className="btn-back" onClick={() => navigate("/workshop")}>
            ← Back to Workshop
          </button>
        </div>

        <div className="project-section">
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search by job number, item, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: "240px",
                maxWidth: "480px",
                padding: "10px 16px",
                fontSize: "0.95rem",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
            <span style={{ color: "#888", fontSize: "0.9rem" }}>
              {filtered.length} card{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              className="btn-add-small"
              onClick={() =>
                navigate(`/workshop/customers/${customerId}/jobcards/new`)
              }
            >
              + New Job Card
            </button>
          </div>

          {/* Status legend */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {Object.entries(STATUS_COLORS).map(([key, val]) => (
              <span
                key={key}
                style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: val.bg,
                  color: val.color,
                }}
              >
                {val.label}
              </span>
            ))}
          </div>

          {loading ? (
            <div
              style={{ textAlign: "center", padding: "60px", color: "#999" }}
            >
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#999",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🗂️</div>
              <h3 style={{ color: "#666", marginBottom: "8px" }}>
                {search ? "No job cards match" : "No job cards yet"}
              </h3>
              {!search && (
                <button
                  className="btn-add-meeting"
                  style={{ marginTop: "16px" }}
                  onClick={() =>
                    navigate(`/workshop/customers/${customerId}/jobcards/new`)
                  }
                >
                  + Create First Job Card
                </button>
              )}
            </div>
          ) : (
            <table className="meetings-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "48px" }}>No</th>
                  <th style={{ width: "200px" }}>Job Card #</th>
                  <th style={{ width: "110px" }}>Date</th>
                  <th>Item</th>
                  <th style={{ width: "120px" }}>Vehicle</th>
                  <th style={{ width: "100px" }}>Status</th>
                  <th style={{ width: "120px" }}>Linked Docs</th>
                  <th style={{ width: "100px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((jc, idx) => {
                  const st = STATUS_COLORS[jc.status] || STATUS_COLORS.open;
                  return (
                    <tr
                      key={jc.id}
                      style={{
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8f9ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                    >
                      <td
                        style={{
                          textAlign: "center",
                          color: "#888",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            navigate(
                              `/workshop/customers/${customerId}/jobcards/${jc.id}`,
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            color: "#2563eb",
                            fontWeight: 600,
                            fontSize: "14px",
                            textDecoration: "underline",
                            textUnderlineOffset: "3px",
                            textAlign: "left",
                          }}
                        >
                          {jc.job_card_number}
                        </button>
                      </td>
                      <td style={{ fontSize: "14px", color: "#555" }}>
                        {jc.date
                          ? (() => {
                              const [y, m, d] = jc.date
                                .split("T")[0]
                                .split("-");
                              return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} ${y}`;
                            })()
                          : "—"}
                      </td>
                      <td style={{ fontSize: "14px", color: "#333" }}>
                        <div style={{ fontWeight: 500 }}>{jc.item || "—"}</div>
                        {jc.item_number && (
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {jc.item_number}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "14px", color: "#555" }}>
                        {jc.vehicle_number || "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: st.bg,
                            color: st.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          {jc.has_item_list && (
                            <span
                              title="Item List"
                              style={{ fontSize: "16px" }}
                            >
                              📋
                            </span>
                          )}
                          {jc.has_labor_sheet && (
                            <span
                              title="Labor Sheet"
                              style={{ fontSize: "16px" }}
                            >
                              👷
                            </span>
                          )}
                          {jc.has_grn && (
                            <span
                              title="Good Received Note"
                              style={{ fontSize: "16px" }}
                            >
                              📥
                            </span>
                          )}
                          {jc.has_dispatch_note && (
                            <span
                              title="Dispatch Note"
                              style={{ fontSize: "16px" }}
                            >
                              🚚
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="btn-download-small"
                            title="Open"
                            onClick={() =>
                              navigate(
                                `/workshop/customers/${customerId}/jobcards/${jc.id}`,
                              )
                            }
                          >
                            📂
                          </button>
                          {isAdmin && (
                            <button
                              className="btn-delete-small"
                              title="Delete"
                              onClick={() => handleDelete(jc.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopJobCardsList;

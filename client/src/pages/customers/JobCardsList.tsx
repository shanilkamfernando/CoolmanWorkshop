// ============================================
// Customer Job Cards — File Attachments Page
// Save as: client/src/pages/customers/JobCardsList.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./ProjectDashboard.css";
import companyLogo from "../../assets/mainlogo.jpeg";
import AppHeader from "../../components/AppHeader";

interface User {
  username: string;
  role: string;
}
interface Customer {
  id: number;
  name: string;
}
interface JobCardFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

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
const fmtSize = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const fmtDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const fileIcon = (type: string) => {
  if (!type) return "📄";
  if (type.includes("pdf")) return "📕";
  if (type.includes("image")) return "🖼️";
  if (type.includes("word") || type.includes("document")) return "📘";
  if (type.includes("sheet") || type.includes("excel")) return "📗";
  return "📄";
};

const JobCardsList = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [files, setFiles] = useState<JobCardFile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const isAdmin = user?.role === "admin";
  const BASE = `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/jobcard-files`;

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    if (location.state?.customer) setCustomer(location.state.customer);
    else fetchCustomer();
    fetchFiles();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const r = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}`,
        { headers: hdr() },
      );
      if (r.data.customer) setCustomer(r.data.customer);
    } catch {}
  };

  const fetchFiles = async () => {
    try {
      const r = await axios.get(BASE, { headers: hdr() });
      setFiles(r.data.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        const base64: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // strip data:...;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await axios.post(
          BASE,
          {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_data: base64,
          },
          { headers: hdr() },
        );
      }
      fetchFiles();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to upload");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  const handleDownload = async (f: JobCardFile) => {
    try {
      const r = await axios.get(`${BASE}/${f.id}`, { headers: hdr() });
      const { file_name, file_type, file_data } = r.data.file;
      // rebuild blob from base64
      const byteChars = atob(file_data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: file_type || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    try {
      await axios.delete(`${BASE}/${id}`, { headers: hdr() });
      fetchFiles();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const filtered = files.filter((f) =>
    f.file_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!customer) return <div className="loading-center">Loading...</div>;
  const initials = getInitials(customer.name);
  const color = getColor(customer.name);

  return (
    <div className="project-dashboard">
      {/* <div className="portal-header">
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
            <span className="customer-logo-text">{customer.name}</span>
          </div>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div> */}
      <AppHeader />

      <div className="project-main-content">
        <div className="project-header-row">
          <h2>🗂️ Job Cards</h2>
          <button
            className="btn-back"
            onClick={() =>
              navigate(`/customers/${customerId}`, { state: { customer } })
            }
          >
            ← Back
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
              placeholder="🔍 Search files..."
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
              {filtered.length} file{filtered.length !== 1 ? "s" : ""}
            </span>
            <label
              className="btn-add-small"
              style={{
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "⏳ Uploading..." : "⬆️ Upload Job Card"}
              <input
                type="file"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
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
                {search
                  ? "No files match your search"
                  : "No job cards uploaded yet"}
              </h3>
              {!search && (
                <label
                  className="btn-add-meeting"
                  style={{
                    marginTop: "16px",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  ⬆️ Upload First Job Card
                  <input
                    type="file"
                    multiple
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
          ) : (
            <table className="meetings-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "48px" }}>No</th>
                  <th>File Name</th>
                  <th style={{ width: "100px" }}>Size</th>
                  <th style={{ width: "160px" }}>Uploaded By</th>
                  <th style={{ width: "170px" }}>Date</th>
                  <th style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, idx) => (
                  <tr
                    key={f.id}
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
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td>
                      <span style={{ marginRight: "8px" }}>
                        {fileIcon(f.file_type)}
                      </span>
                      <span style={{ fontWeight: 500 }}>{f.file_name}</span>
                    </td>
                    <td style={{ fontSize: "14px", color: "#555" }}>
                      {fmtSize(f.file_size)}
                    </td>
                    <td style={{ fontSize: "14px", color: "#555" }}>
                      {f.uploaded_by || "—"}
                    </td>
                    <td style={{ fontSize: "14px", color: "#555" }}>
                      {fmtDate(f.created_at)}
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
                          title="Download"
                          onClick={() => handleDownload(f)}
                        >
                          ⬇️
                        </button>
                        {isAdmin && (
                          <button
                            className="btn-delete-small"
                            title="Delete"
                            onClick={() => handleDelete(f.id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCardsList;

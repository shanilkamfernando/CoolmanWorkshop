// ============================================
// Documents Dashboard - List Layout
// Save as: client/src/pages/customers/DocumentsDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./ProjectDashboard.css";
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

interface Document {
  id: number;
  document_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

const DocumentsDashboard = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null,
  );
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    if (location.state?.customer) {
      setCustomer(location.state.customer);
    } else {
      fetchCustomer();
    }
    fetchDocuments();
  }, [customerId, location]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredDocuments(
        documents.filter(
          (doc) =>
            doc.document_name.toLowerCase().includes(q) ||
            doc.file_type.toLowerCase().includes(q) ||
            doc.uploaded_by.toLowerCase().includes(q),
        ),
      );
    }
  }, [searchQuery, documents]);

  const isAdmin = user?.role === "admin";

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.customer) setCustomer(response.data.customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/documents`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDocuments(response.data.documents || []);
      setFilteredDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
      setFilteredDocuments([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentName) setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }
    if (!documentName.trim()) {
      alert("Please enter a document name");
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_name", documentName);
      formData.append("uploaded_by", user?.username || "Unknown");

      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/documents/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setDocumentName("");
        fetchDocuments();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/documents/${doc.id}/download`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.document_name);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    if (!isAdmin) {
      alert("Only admins can delete documents");
      return;
    }
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/documents/${documentToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (
      fileType.includes("image") ||
      fileType.includes("png") ||
      fileType.includes("jpg")
    )
      return "🖼️";
    if (fileType.includes("zip") || fileType.includes("rar")) return "🗜️";
    return "📎";
  };

  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
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
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (!customer) return <div className="loading-center">Loading...</div>;

  const initials = getInitials(customer.name);
  const color = getColorFromName(customer.name);

  return (
    <div className="project-dashboard">
      {/* Header */}
      {/* <div className="portal-header">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => navigate("/dashboard")}
          >
            <img
              src={companyLogo}
              alt="Company Logo"
              className="company-logo"
            />
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

      {/* Main Content */}
      <div className="project-main-content">
        <div className="project-header-row">
          <h2>📁 Documents</h2>
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
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              gap: "16px",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search by name, type or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.9rem", color: "#888" }}>
                {filteredDocuments.length} document
                {filteredDocuments.length !== 1 ? "s" : ""}
              </span>
              <button
                className="btn-add-small"
                onClick={() => setShowUploadModal(true)}
              >
                📤 Upload Document
              </button>
            </div>
          </div>

          {/* Documents Table */}
          {filteredDocuments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#999",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📁</div>
              <h3 style={{ color: "#666", marginBottom: "8px" }}>
                {searchQuery
                  ? "No documents match your search"
                  : "No documents yet"}
              </h3>
              <p style={{ marginBottom: "20px" }}>
                {searchQuery
                  ? "Try a different keyword"
                  : "Upload your first document to get started"}
              </p>
              {!searchQuery && (
                <button
                  className="btn-add-meeting"
                  onClick={() => setShowUploadModal(true)}
                >
                  📤 Upload Document
                </button>
              )}
            </div>
          ) : (
            <table className="meetings-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "55px" }}>No</th>
                  <th style={{ width: "44px" }}>Type</th>
                  <th>Document</th>
                  <th style={{ width: "100px" }}>Size</th>
                  <th style={{ width: "120px" }}>Uploaded By</th>
                  <th style={{ width: "110px" }}>Date</th>
                  <th style={{ width: "75px" }}>Time</th>
                  <th style={{ width: "90px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc, index) => {
                  const { date, time } = formatDateTime(doc.created_at);
                  const isDownloading = downloadingId === doc.id;
                  return (
                    <tr
                      key={doc.id}
                      style={{ transition: "background 0.15s" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8f9ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                    >
                      {/* No */}
                      <td
                        style={{
                          textAlign: "center",
                          fontSize: "15px",
                          color: "#666",
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </td>

                      {/* File type icon */}
                      <td style={{ textAlign: "center", fontSize: "1.3rem" }}>
                        {getFileIcon(doc.file_type)}
                      </td>

                      {/* Document name as clickable link */}
                      <td>
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={isDownloading}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: isDownloading ? "wait" : "pointer",
                            textAlign: "left",
                            width: "100%",
                          }}
                          title={`Download ${doc.document_name}`}
                        >
                          <span
                            style={{
                              color: isDownloading ? "#aaa" : "#2563eb",
                              fontWeight: 500,
                              fontSize: "15px",
                              textDecoration: "underline",
                              textUnderlineOffset: "3px",
                              wordBreak: "break-word",
                            }}
                          >
                            {isDownloading
                              ? "⏳ Downloading..."
                              : `⬇️ ${doc.document_name}`}
                          </span>
                        </button>
                      </td>

                      {/* File size */}
                      <td style={{ fontSize: "14px", color: "#555" }}>
                        {formatFileSize(doc.file_size)}
                      </td>

                      {/* Uploaded by */}
                      <td style={{ fontSize: "14px", color: "#555" }}>
                        {doc.uploaded_by}
                      </td>

                      {/* Date */}
                      <td
                        style={{
                          fontSize: "14px",
                          color: "#555",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {date}
                      </td>

                      {/* Time */}
                      <td
                        style={{
                          fontSize: "14px",
                          color: "#555",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {time}
                      </td>

                      {/* Actions */}
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
                            onClick={() => handleDownload(doc)}
                            disabled={isDownloading}
                            title="Download"
                          >
                            ⬇️
                          </button>
                          {isAdmin && (
                            <button
                              className="btn-delete-small"
                              onClick={() => handleDeleteClick(doc)}
                              title="Delete (Admin only)"
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="modal-header">
              <h2>📤 Upload Document</h2>
              <button
                className="close-button"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Document Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "1rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Select File <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "1rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />
                {selectedFile && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: "#f0f7ff",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                    }}
                  >
                    {getFileIcon(selectedFile.type)} {selectedFile.name} (
                    {formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "⏳ Uploading..." : "📤 Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && documentToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🗑️ Delete Document</h2>
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
                <strong>{documentToDelete.document_name}</strong>?
              </p>
              <p
                style={{
                  color: "#f44336",
                  marginTop: "10px",
                  fontSize: "0.9rem",
                }}
              >
                ⚠️ This action cannot be undone.
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

export default DocumentsDashboard;

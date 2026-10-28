// ============================================
// Documents Dashboard - File Management System
// Save as: client/src/pages/documents/Documents.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Documents.css";
import companyLogo from "../../assets/mainlogo.png";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DocumentFile {
  id: number;
  category: "word" | "formats" | "catalogs";
  folder_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    "word" | "formats" | "catalogs"
  >("word");
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DocumentFile | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDocuments();
  }, []);

  const isAdmin = user?.role === "admin";

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://coolmanworkshop-production.up.railway.app/api/documents/files",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDocuments(response.data.files || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-fill with original filename (user can edit)
      setCustomFileName(file.name);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    if (!customFileName.trim()) {
      alert("Please enter a filename");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", activeCategory);
    formData.append("custom_filename", customFileName);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/documents/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        alert("File uploaded successfully!");
        setShowAddFileModal(false);
        setSelectedFile(null);
        setCustomFileName("");
        fetchDocuments();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  };

  const handleDeleteClick = (file: DocumentFile) => {
    if (!isAdmin) {
      alert("Only admins can delete files");
      return;
    }
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/documents/files/${fileToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("File deleted successfully!");
      setShowDeleteConfirm(false);
      setFileToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };

  const handleDownloadFile = async (file: DocumentFile) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/documents/download/${file.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const getFilteredFiles = () => {
    const categoryFiles = documents.filter(
      (doc) => doc.category === activeCategory,
    );

    if (!searchTerm.trim()) {
      return categoryFiles;
    }

    return categoryFiles.filter((file: DocumentFile) =>
      file.file_name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "word":
        return "📄";
      case "formats":
        return "📋";
      case "catalogs":
        return "📚";
      default:
        return "📁";
    }
  };

  return (
    <div className="documents-dashboard">
      {/* Header */}
      <div className="documents-header">
        <div className="header-left">
          <div className="logo-container" onClick={handleBackToDashboard}>
            <img
              src={companyLogo}
              alt="Company Logo"
              className="company-logo"
            />
          </div>
          <h1 className="header-title" onClick={handleBackToDashboard}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="portal-name">Documents</span>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="documents-main-content">
        {/* Category Tabs */}
        <div className="category-tabs">
          <button
            className={`category-tab ${activeCategory === "word" ? "active" : ""}`}
            onClick={() => setActiveCategory("word")}
          >
            📄 Word Documents
          </button>
          <button
            className={`category-tab ${activeCategory === "formats" ? "active" : ""}`}
            onClick={() => setActiveCategory("formats")}
          >
            📋 Formats
          </button>
          <button
            className={`category-tab ${activeCategory === "catalogs" ? "active" : ""}`}
            onClick={() => setActiveCategory("catalogs")}
          >
            📚 Catalogs
          </button>
        </div>

        {/* Search and Actions */}
        <div className="documents-toolbar">
          <div className="search-box">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files in this category..."
              className="search-input"
            />
          </div>
          <div className="toolbar-actions">
            <button
              className="btn-add-file"
              onClick={() => setShowAddFileModal(true)}
            >
              📤 Upload File
            </button>
          </div>
        </div>

        {/* Files List */}
        <div className="folders-container">
          {getFilteredFiles().length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {getCategoryIcon(activeCategory)}
              </div>
              <h3>{searchTerm ? "No files found" : "No documents yet"}</h3>
              <p>
                {searchTerm
                  ? "Try a different search term"
                  : "Upload your first file to get started"}
              </p>
              {!searchTerm && (
                <button
                  className="btn-add-file"
                  onClick={() => setShowAddFileModal(true)}
                >
                  📤 Upload File
                </button>
              )}
            </div>
          ) : (
            <div className="files-without-folder">
              <div className="section-header">
                <span className="section-title">
                  📎 Files ({getFilteredFiles().length})
                </span>
              </div>
              <div className="file-list">
                {getFilteredFiles().map((file) => (
                  <div key={file.id} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">📎</span>
                      <div className="file-details">
                        <span className="file-name">{file.file_name}</span>
                        <span className="file-meta">
                          {formatFileSize(file.file_size)} • Uploaded by{" "}
                          {file.uploaded_by} •{" "}
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="file-actions">
                      <button
                        className="btn-download"
                        onClick={() => handleDownloadFile(file)}
                      >
                        ⬇️ Download
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-delete-file"
                          onClick={() => handleDeleteClick(file)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload File Modal */}
      {showAddFileModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddFileModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Upload File to{" "}
                {activeCategory === "word"
                  ? "Word Documents"
                  : activeCategory === "formats"
                    ? "Formats"
                    : "Catalogs"}
              </h2>
              <button
                className="close-button"
                onClick={() => setShowAddFileModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Select File <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="form-input"
                />
                {selectedFile && (
                  <small className="file-selected">
                    Original: {selectedFile.name} (
                    {formatFileSize(selectedFile.size)})
                  </small>
                )}
              </div>

              {selectedFile && (
                <div className="form-group">
                  <label>
                    Save As <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="Enter filename to save as"
                    className="form-input"
                  />
                  <small>
                    This is the name that will be saved in the system
                  </small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddFileModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleUploadFile}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && fileToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete File</h2>
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
                <strong>{fileToDelete.file_name}</strong>?
              </p>
              <p style={{ color: "#f44336", marginTop: "10px" }}>
                This action cannot be undone.
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

export default Documents;

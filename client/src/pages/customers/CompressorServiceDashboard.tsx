// ============================================
// Compressor Service Dashboard
// Save as: client/src/pages/customers/CompressorServiceDashboard.tsx
// ============================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./CompressorServiceDashboard.css";
import "./ProjectDashboard.css";
import AppHeader from "../../components/AppHeader";
import companyLogo from "../../assets/mainlogo.png";

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
interface ServiceCompany {
  id: number;
  name: string;
}

interface CompressorDetails {
  id: number;
  compressor_type: string;
  serial_number: string;
  compressor_name: string;
  coupling_type: string;
  used_for: string;
  installed_year: string;
  name_tag_filename: string;
  name_tag_data: string;
  name_tag_mime: string;
  created_at: string;
}

interface Attachment {
  id: number;
  record_id: number;
  attachment_type: "report" | "invoice";
  original_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

interface ServiceRecord {
  id: number;
  start_date: string;
  finished_date: string;
  service_type: string;
  due_running_hours: string;
  serviced_running_hours: string;
  service_instructor: string;
  // vehicle: string;
  next_service_type: string;
  next_service_running_hours: string;
  job_card_filename: string;
  job_card_data: string;
  job_card_mime: string;
  attachments: Attachment[];
}

// ── Master Password Setup Modal (admin only) ──────────────────────────────
const MasterPasswordModal = ({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (password.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/attachments/master-password",
        { password },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(
        "Master password saved! All users will use this password to download files.",
      );
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to save password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* password model */}
      {/* <div className="att-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Set Master Download Password</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="pwd-info-box">
            <p>
              This password will be required by <strong>all users</strong> to
              download any attachment. Only admins can change it.
            </p>
          </div>
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>New Password</label>
            <div className="pwd-input-wrap">
              <input
                type={show ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
              />
              <button className="pwd-toggle" onClick={() => setShow(!show)}>
                {show ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "12px" }}>
            <label>Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Password"}
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
};

// ── Upload Modal ──────────────────────────────────────────────────────────
const UploadModal = ({
  recordId,
  type,
  uploadedBy,
  onClose,
  onSuccess,
}: {
  recordId: number;
  type: "report" | "invoice";
  uploadedBy: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10 MB");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem("token");
      await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/service-records/${recordId}/attachments`,
        {
          attachment_type: type,
          original_name: file.name,
          file_data: base64,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          uploaded_by: uploadedBy,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="att-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload {type === "report" ? "Report" : "Invoice"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div
            className="upload-drop-zone"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="upload-file-selected">
                <span className="upload-file-icon">📄</span>
                <span className="upload-file-name">{file.name}</span>
                <span className="upload-file-size">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <>
                <span className="upload-icon">📁</span>
                <p>Click to select a file</p>
                <span className="upload-hint">
                  PDF, DOC, DOCX, XLS, XLSX, PNG, JPG · Max 10 MB
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="pwd-info-box">
            🔒 This file will be protected by the{" "}
            <strong>master download password</strong> set by your admin.
          </div>
        </div>
        <div className="modal-footer">
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-save"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Download Modal ────────────────────────────────────────────────────────
const DownloadModal = ({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleDownload = async () => {
    if (!password) {
      setError("Please enter the master password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/attachments/${attachment.id}/download`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Decode base64 and trigger browser download
      const { file_data, original_name, mime_type } = res.data;
      const byteChars = atob(file_data);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: mime_type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("Incorrect password. Please try again.");
      } else {
        setError(err?.response?.data?.error || "Download failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="att-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Download File</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="download-file-info">
            <span className="download-file-icon">📄</span>
            <div>
              <div className="download-file-name">
                {attachment.original_name}
              </div>
              <div className="download-file-meta">
                {(attachment.file_size / 1024).toFixed(1)} KB · by{" "}
                {attachment.uploaded_by}
              </div>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>🔒 Enter Master Download Password</label>
            <div className="pwd-input-wrap" style={{ marginTop: "6px" }}>
              <input
                type={show ? "text" : "password"}
                className={`form-input ${error ? "input-error" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter the master password..."
                onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                autoFocus
              />
              <button className="pwd-toggle" onClick={() => setShow(!show)}>
                {show ? "🙈" : "👁"}
              </button>
            </div>
            {error && <span className="error-text">{error}</span>}
          </div>
        </div>
        <div className="modal-footer">
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-save"
              onClick={handleDownload}
              disabled={loading}
            >
              {loading ? "Verifying..." : "⬇ Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Attachments Cell ──────────────────────────────────────────────────────
const AttachmentsCell = ({
  recordId,
  type,
  attachments,
  uploadedBy,
  onRefresh,
  isAdmin,
  onDeleteAttachment,
}: {
  recordId: number;
  type: "report" | "invoice";
  attachments: Attachment[];
  uploadedBy: string;
  onRefresh: () => void;
  isAdmin: boolean;
  onDeleteAttachment: (id: number) => void;
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<Attachment | null>(null);
  const filtered = attachments.filter((a) => a.attachment_type === type);

  return (
    <div className="attachments-cell">
      {filtered.map((att) => (
        <div key={att.id} className="att-chip">
          <button
            className="att-name-btn"
            onClick={() => setDownloadTarget(att)}
            title={att.original_name}
          >
            🔒{" "}
            {att.original_name.length > 16
              ? att.original_name.slice(0, 14) + "…"
              : att.original_name}
          </button>
          {isAdmin && (
            <button
              className="att-delete-btn"
              onClick={() => onDeleteAttachment(att.id)}
              title="Delete"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button className="att-add-btn" onClick={() => setShowUpload(true)}>
        + Add
      </button>

      {showUpload && (
        <UploadModal
          recordId={recordId}
          type={type}
          uploadedBy={uploadedBy}
          onClose={() => setShowUpload(false)}
          onSuccess={onRefresh}
        />
      )}
      {downloadTarget && (
        <DownloadModal
          attachment={downloadTarget}
          onClose={() => setDownloadTarget(null)}
        />
      )}
    </div>
  );
};

const NameTagCell = ({
  compressor,
  customerId,
  companyId,
  onRefresh,
  isAdmin,
}: {
  compressor: CompressorDetails;
  customerId: string;
  companyId: string;
  onRefresh: () => void;
  isAdmin: boolean;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem("token");
      await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/compressors/${compressor.id}/nametag`,
        { file_data: base64, filename: file.name, mime_type: file.type },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (!compressor.name_tag_data) return;
    const byteChars = atob(compressor.name_tag_data);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++)
      byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: compressor.name_tag_mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = compressor.name_tag_filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm("Remove this name tag?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/compressors/${compressor.id}/nametag`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="attachments-cell">
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={handleUpload}
      />

      {compressor.name_tag_filename ? (
        <div className="att-chip">
          <button
            className="att-name-btn"
            onClick={handleDownload}
            title={compressor.name_tag_filename}
          >
            📎{" "}
            {compressor.name_tag_filename.length > 14
              ? compressor.name_tag_filename.slice(0, 12) + "…"
              : compressor.name_tag_filename}
          </button>
          {isAdmin && (
            <button
              className="att-delete-btn"
              onClick={handleDelete}
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          className="att-add-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "⏳" : "+ Upload"}
        </button>
      )}
    </div>
  );
};

const JobCardCell = ({
  record,
  customerId,
  companyId,
  onRefresh,
  isAdmin,
}: {
  record: ServiceRecord;
  customerId: string;
  companyId: string;
  onRefresh: () => void;
  isAdmin: boolean;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem("token");
      await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/records/${record.id}/jobcard`,
        { file_data: base64, filename: file.name, mime_type: file.type },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (!record.job_card_data) return;
    const byteChars = atob(record.job_card_data);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++)
      byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: record.job_card_mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = record.job_card_filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm("Remove this job card?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/records/${record.id}/jobcard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="attachments-cell">
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={handleUpload}
      />
      {record.job_card_filename ? (
        <div className="att-chip">
          <button
            className="att-name-btn"
            onClick={handleDownload}
            title={record.job_card_filename}
          >
            🗂️{" "}
            {record.job_card_filename.length > 14
              ? record.job_card_filename.slice(0, 12) + "…"
              : record.job_card_filename}
          </button>
          {isAdmin && (
            <button
              className="att-delete-btn"
              onClick={handleDelete}
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          className="att-add-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "⏳" : "+ Upload"}
        </button>
      )}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────
const CompressorServiceDashboard = () => {
  const navigate = useNavigate();
  const { customerId, companyId } = useParams();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [serviceCompany, setServiceCompany] = useState<ServiceCompany | null>(
    null,
  );
  const [compressors, setCompressors] = useState<CompressorDetails[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [showAddCompressor, setShowAddCompressor] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showMasterPwd, setShowMasterPwd] = useState(false);
  const [hasMasterPwd, setHasMasterPwd] = useState(false);

  const [newCompressor, setNewCompressor] = useState({
    compressor_type: "",
    serial_number: "",
    compressor_name: "",
    coupling_type: "",
    used_for: "",
    installed_year: "",
  });

  const [newService, setNewService] = useState({
    start_date: "",
    finished_date: "",
    service_type: "",
    due_running_hours: "",
    serviced_running_hours: "",

    // vehicle: "",
    next_service_type: "",
    next_service_running_hours: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    if (location.state?.customer) setCustomer(location.state.customer);
    if (location.state?.company) setServiceCompany(location.state.company);
    fetchCompressors();
    fetchServiceRecords();
    checkMasterPassword();
  }, [customerId, companyId]);

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const checkMasterPassword = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://coolmanworkshop-production.up.railway.app/api/attachments/master-password/status",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setHasMasterPwd(res.data.hasPassword);
    } catch {
      setHasMasterPwd(false);
    }
  };

  const fetchCompressors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/compressors`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCompressors(res.data.compressors || []);
    } catch {
      setCompressors([]);
    }
  };

  const fetchServiceRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/records`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setServiceRecords(res.data.records || []);
    } catch {
      setServiceRecords([]);
    }
  };

  const handleAddCompressor = async () => {
    if (!newCompressor.compressor_type || !newCompressor.serial_number) {
      alert("Compressor Type and Serial Number are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/compressors`,
        newCompressor,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowAddCompressor(false);
      setNewCompressor({
        compressor_type: "",
        serial_number: "",
        compressor_name: "",
        coupling_type: "",
        used_for: "",
        installed_year: "",
      });
      fetchCompressors();
    } catch {
      alert("Failed to add compressor");
    }
  };

  const handleDeleteCompressor = async (id: number) => {
    if (!confirm("Delete this compressor?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/compressors/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchCompressors();
    } catch {
      alert("Failed to delete");
    }
  };

  const handleAddService = async () => {
    if (!newService.start_date || !newService.service_type) {
      alert("Start Date and Service Type are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/records`,
        { ...newService, service_instructor: user?.username || "Unknown" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowAddService(false);
      setNewService({
        start_date: "",
        finished_date: "",
        service_type: "",
        due_running_hours: "",
        serviced_running_hours: "",
        // vehicle: "",
        next_service_type: "",
        next_service_running_hours: "",
      });
      fetchServiceRecords();
    } catch {
      alert("Failed to add service record");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Delete this service record and all its attachments?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/compressor-service/${companyId}/records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchServiceRecords();
    } catch {
      alert("Failed to delete");
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    if (!confirm("Delete this attachment permanently?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/attachments/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchServiceRecords();
    } catch {
      alert("Failed to delete attachment");
    }
  };

  const fmtDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getInitials = (name: string) => {
    const w = name.trim().split(" ");
    return w.length === 1
      ? w[0].substring(0, 2).toUpperCase()
      : (w[0][0] + w[w.length - 1][0]).toUpperCase();
  };

  const getColor = (name: string) => {
    const colors = [
      "#1976D2",
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

  if (!customer || !serviceCompany)
    return <div className="loading-center">Loading...</div>;

  return (
    <div className="project-dashboard">
      <AppHeader />

      {/* Main */}
      <div className="project-main-content">
        <div className="project-header-row">
          <h2>{serviceCompany.name}</h2>
          <button
            className="btn-back"
            onClick={() =>
              navigate(`/customers/${customerId}/compressor-service`, {
                state: { customer },
              })
            }
          >
            ← Back
          </button>
        </div>

        {/* No password warning */}
        {/* {isAdmin && !hasMasterPwd && (
          <div className="no-pwd-warning">
            ⚠️ No master download password has been set. Users won't be able to
            upload attachments until you set one.
            <button
              className="btn-set-pwd-inline"
              onClick={() => setShowMasterPwd(true)}
            >
              Set Password Now
            </button>
          </div>
        )} */}

        {/* ── Compressors ── */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Compressor Details</h3>
            <button
              className="btn-add-small"
              onClick={() => setShowAddCompressor(!showAddCompressor)}
            >
              + Add Compressor
            </button>
          </div>

          {showAddCompressor && (
            <div className="inline-form-panel">
              <h4 className="inline-form-title">New Compressor</h4>
              <div className="inline-form-grid">
                {[
                  {
                    label: "Compressor Type *",
                    key: "compressor_type",
                    ph: "e.g. Screw",
                  },
                  {
                    label: "Serial Number *",
                    key: "serial_number",
                    ph: "Serial Number",
                  },
                  {
                    label: "Compressor Name",
                    key: "compressor_name",
                    ph: "Name",
                  },
                  {
                    label: "Coupling Type",
                    key: "coupling_type",
                    ph: "Coupling Type",
                  },
                  { label: "Application", key: "used_for", ph: "Used For" },
                  {
                    label: "Installed Year",
                    key: "installed_year",
                    ph: "Year",
                  },
                ].map(({ label, key, ph }) => (
                  <div key={key} className="form-group">
                    <label>{label}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={(newCompressor as any)[key]}
                      onChange={(e) =>
                        setNewCompressor({
                          ...newCompressor,
                          [key]: e.target.value,
                        })
                      }
                      placeholder={ph}
                    />
                  </div>
                ))}
              </div>
              <div className="inline-form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowAddCompressor(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleAddCompressor}>
                  Add Compressor
                </button>
              </div>
            </div>
          )}

          <table className="meetings-table">
            <thead>
              <tr>
                {[
                  "Compressor Type",
                  "Serial Number",
                  "Compressor Name",
                  "Coupling Type",
                  "Used For",
                  "Installed Year",
                  "Name Tag",
                  // "Date Added",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {compressors.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="empty-td">
                    No compressors yet. Click "+ Add Compressor".
                  </td>
                </tr>
              ) : (
                compressors.map((c) => (
                  <tr key={c.id}>
                    <td>{c.compressor_type}</td>
                    <td>{c.serial_number}</td>
                    <td>{c.compressor_name || "—"}</td>
                    <td>{c.coupling_type || "—"}</td>
                    <td>{c.used_for || "—"}</td>
                    <td>{c.installed_year || "—"}</td>
                    <td>
                      <NameTagCell
                        compressor={c}
                        customerId={customerId || ""}
                        companyId={companyId || ""}
                        onRefresh={fetchCompressors}
                        isAdmin={isAdmin}
                      />
                    </td>
                    {/* <td>{fmtDate(c.created_at)}</td> */}
                    {isAdmin && <th>Actions</th>} (
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteCompressor(c.id)}
                      >
                        🗑️
                      </button>
                    </td>
                    )
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Service Records ── */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Service Records</h3>
            <button
              className="btn-add-small"
              onClick={() => setShowAddService(!showAddService)}
            >
              + Add Service
            </button>
          </div>

          {showAddService && (
            <div className="inline-form-panel">
              <div className="auto-fill-banner">
                <strong>Service Instructor:</strong> {user?.username}{" "}
                <span>(auto-filled from your login)</span>
              </div>
              <div className="inline-form-grid" style={{ marginTop: "14px" }}>
                {[
                  { label: "Start Date *", key: "start_date", type: "date" },
                  {
                    label: "Finished Date",
                    key: "finished_date",
                    type: "date",
                  },
                  {
                    label: "Service Type *",
                    key: "service_type",
                    type: "text",
                    ph: "e.g. Maintenance",
                  },
                  {
                    label: "Due Running Hours",
                    key: "due_running_hours",
                    type: "text",
                    ph: "Hours",
                  },
                  {
                    label: "Serviced Running Hours",
                    key: "serviced_running_hours",
                    type: "text",
                    ph: "Hours",
                  },
                  // {
                  //   label: "Vehicle",
                  //   key: "vehicle",
                  //   type: "text",
                  //   ph: "Vehicle ID",
                  // },
                  {
                    label: "Next Service Type",
                    key: "next_service_type",
                    type: "text",
                    ph: "Next Service",
                  },
                  {
                    label: "Next Service Running Hours",
                    key: "next_service_running_hours",
                    type: "text",
                    ph: "Hours",
                  },
                ].map(({ label, key, type, ph }) => (
                  <div key={key} className="form-group">
                    <label>{label}</label>
                    <input
                      type={type}
                      className="form-input"
                      value={(newService as any)[key]}
                      onChange={(e) =>
                        setNewService({ ...newService, [key]: e.target.value })
                      }
                      placeholder={ph}
                    />
                  </div>
                ))}
              </div>
              <div className="inline-form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowAddService(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleAddService}>
                  Add Service Record
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table className="meetings-table" style={{ minWidth: "1200px" }}>
              <thead>
                <tr>
                  {[
                    "Start Date",
                    "Finished Date",
                    "Service Type",
                    "Due Hrs",
                    "Serviced Hrs",
                    "Instructor",
                    // "Vehicle",
                    "Next Service",
                    "Next Hrs",
                    "Job Card",
                    "Reports",
                    "Invoices",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {serviceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 12 : 11} className="empty-td">
                      No service records yet. Click "+ Add Service".
                    </td>
                  </tr>
                ) : (
                  serviceRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td>{fmtDate(rec.start_date)}</td>
                      <td>{fmtDate(rec.finished_date)}</td>
                      <td>{rec.service_type}</td>
                      <td>{rec.due_running_hours || "—"}</td>
                      <td>{rec.serviced_running_hours || "—"}</td>
                      <td>{rec.service_instructor}</td>
                      {/* <td>{rec.vehicle || "—"}</td> */}
                      <td>{rec.next_service_type || "—"}</td>
                      <td>{rec.next_service_running_hours || "—"}</td>
                      <td>
                        <JobCardCell
                          record={rec}
                          customerId={customerId || ""}
                          companyId={companyId || ""}
                          onRefresh={fetchServiceRecords}
                          isAdmin={isAdmin}
                        />
                      </td>
                      <td>
                        <AttachmentsCell
                          recordId={rec.id}
                          type="report"
                          attachments={rec.attachments || []}
                          uploadedBy={user?.username || "Unknown"}
                          onRefresh={fetchServiceRecords}
                          isAdmin={isAdmin}
                          onDeleteAttachment={handleDeleteAttachment}
                        />
                      </td>
                      <td>
                        <AttachmentsCell
                          recordId={rec.id}
                          type="invoice"
                          attachments={rec.attachments || []}
                          uploadedBy={user?.username || "Unknown"}
                          onRefresh={fetchServiceRecords}
                          isAdmin={isAdmin}
                          onDeleteAttachment={handleDeleteAttachment}
                        />
                      </td>
                      {isAdmin && <th>Actions</th>} (
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteService(rec.id)}
                        >
                          🗑️
                        </button>
                      </td>
                      )
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Master Password Modal */}
      {showMasterPwd && (
        <MasterPasswordModal
          onClose={() => setShowMasterPwd(false)}
          onSaved={checkMasterPassword}
        />
      )}
    </div>
  );
};

export default CompressorServiceDashboard;

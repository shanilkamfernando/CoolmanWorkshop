// ============================================
// System Repair Dashboard
// Save as: client/src/pages/customers/SystemRepairDashboard.tsx
// ============================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./ProjectDashboard.css";
import companyLogo from "../../assets/mainlogo.jpeg";

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

interface SystemRepairRecord {
  id: number;
  start_date: string;
  finished_date: string;
  repair_reason: string;
  repaired_areas: string;
  repair_instructor: string;
  // repair_team: string;
  // vehicle: string;
  // driver: string;
  note: string;
  report: string;
  invoice: string;
  job_card_filename: string;
  job_card_data: string;
  job_card_mime: string;
  report_filename: string;
  report_data: string;
  report_mime: string;
  invoice_filename: string;
  invoice_data: string;
  invoice_mime: string;
}

const SystemRepairJobCardCell = ({
  record,
  customerId,
  onRefresh,
  isAdmin,
}: {
  record: SystemRepairRecord;
  customerId: string;
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
        `http://localhost:5000/api/customers/${customerId}/system-repair/records/${record.id}/jobcard`,
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
        `http://localhost:5000/api/customers/${customerId}/system-repair/records/${record.id}/jobcard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <td style={{ padding: "6px 8px" }}>
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={handleUpload}
      />
      {record.job_card_filename ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={handleDownload}
            title={record.job_card_filename}
            style={{
              background: "none",
              border: "1px solid #667eea",
              borderRadius: "4px",
              padding: "2px 8px",
              cursor: "pointer",
              color: "#667eea",
              fontSize: "12px",
            }}
          >
            🗂️{" "}
            {record.job_card_filename.length > 12
              ? record.job_card_filename.slice(0, 10) + "…"
              : record.job_card_filename}
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#f44336",
                fontSize: "14px",
                padding: "0 2px",
              }}
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            background: "none",
            border: "1px dashed #ccc",
            borderRadius: "4px",
            padding: "2px 10px",
            cursor: "pointer",
            color: "#888",
            fontSize: "12px",
          }}
        >
          {uploading ? "⏳" : "+ Upload"}
        </button>
      )}
    </td>
  );
};

const FileAttachmentCell = ({
  recordId,
  customerId,
  endpoint,
  filename,
  fileData,
  fileMime,
  icon,
  onRefresh,
  isAdmin,
}: {
  recordId: number;
  customerId: string;
  endpoint: string;
  filename: string;
  fileData: string;
  fileMime: string;
  icon: string;
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
        `http://localhost:5000/api/customers/${customerId}/system-repair/records/${recordId}/${endpoint}`,
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
    if (!fileData) return;
    const byteChars = atob(fileData);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++)
      byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: fileMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm(`Remove this ${endpoint}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/customers/${customerId}/system-repair/records/${recordId}/${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <td style={{ padding: "6px 8px" }}>
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={handleUpload}
      />
      {filename ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={handleDownload}
            title={filename}
            style={{
              background: "none",
              border: "1px solid #667eea",
              borderRadius: "4px",
              padding: "2px 8px",
              cursor: "pointer",
              color: "#667eea",
              fontSize: "12px",
            }}
          >
            {icon}{" "}
            {filename.length > 12 ? filename.slice(0, 10) + "…" : filename}
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#f44336",
                fontSize: "14px",
                padding: "0 2px",
              }}
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            background: "none",
            border: "1px dashed #ccc",
            borderRadius: "4px",
            padding: "2px 10px",
            cursor: "pointer",
            color: "#888",
            fontSize: "12px",
          }}
        >
          {uploading ? "⏳" : "+ Upload"}
        </button>
      )}
    </td>
  );
};

const SystemRepairDashboard = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [repairRecords, setRepairRecords] = useState<SystemRepairRecord[]>([]);
  const [showAddRepair, setShowAddRepair] = useState(false);

  const [newRepair, setNewRepair] = useState<Partial<SystemRepairRecord>>({
    start_date: "",
    finished_date: "",
    repair_reason: "",
    repaired_areas: "",
    repair_instructor: "",
    // repair_team: "",
    // vehicle: "",
    // driver: "",
    note: "",
    report: "",
    invoice: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (location.state?.customer) {
      setCustomer(location.state.customer);
    } else {
      fetchCustomer();
    }

    fetchRepairRecords();
  }, [customerId, location]);

  const isAdmin = user?.role === "admin";

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/customers/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.customer) {
        setCustomer(response.data.customer);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchRepairRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/customers/${customerId}/system-repair/records`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRepairRecords(response.data.records || []);
    } catch (error) {
      console.error("Error fetching repair records:", error);
      setRepairRecords([]);
    }
  };

  const handleAddRepairRecord = async () => {
    if (!newRepair.start_date || !newRepair.repair_reason) {
      alert("Please fill in at least Start Date and Repair Reason");
      return;
    }

    const repairRecordData = {
      ...newRepair,
      repair_instructor: user?.username || "Unknown User",
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/customers/${customerId}/system-repair/records`,
        repairRecordData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("System repair record added successfully!");
        setShowAddRepair(false);
        resetNewRepairForm();
        fetchRepairRecords();
      }
    } catch (error) {
      console.error("Error adding repair record:", error);
      alert("Failed to add repair record");
    }
  };

  const resetNewRepairForm = () => {
    setNewRepair({
      start_date: "",
      finished_date: "",
      repair_reason: "",
      repaired_areas: "",
      repair_instructor: "",
      // repair_team: "",
      // vehicle: "",
      // driver: "",
      note: "",
      report: "",
      invoice: "",
    });
  };

  const handleUpdateRepairRecord = (
    id: number,
    field: keyof SystemRepairRecord,
    value: string,
  ) => {
    if (!isAdmin) {
      alert("Only admins can edit repair records");
      return;
    }
    setRepairRecords(
      repairRecords.map((record) =>
        record.id === id ? { ...record, [field]: value } : record,
      ),
    );
  };

  const handleDeleteRepairRecord = async (id: number) => {
    if (!isAdmin) {
      alert("Only admins can delete repair records");
      return;
    }

    if (!confirm("Delete this repair record?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/customers/${customerId}/system-repair/records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Repair record deleted!");
      fetchRepairRecords();
    } catch (error) {
      console.error("Error deleting repair record:", error);
      alert("Failed to delete repair record");
    }
  };

  const handleBack = () => {
    navigate(`/customers/${customerId}`, { state: { customer } });
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
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
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (!customer) {
    return <div className="loading-center">Loading...</div>;
  }

  const initials = getInitials(customer.name);
  const color = getColorFromName(customer.name);

  return (
    <div className="project-dashboard">
      {/* Header */}
      <div className="portal-header">
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
      </div>

      {/* Main Content */}
      <div className="project-main-content">
        <div className="project-header-row">
          <h2>System Repair</h2>
          <button className="btn-back" onClick={handleBack}>
            ← Back
          </button>
        </div>

        {/* System Repair Records Section */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Repair Records</h3>
            <button
              className="btn-add-small"
              onClick={() => setShowAddRepair(!showAddRepair)}
            >
              + Add Repair
            </button>
          </div>

          {/* Add Repair Form */}
          {showAddRepair && (
            <div
              className="add-service-form"
              style={{
                marginBottom: "20px",
                padding: "20px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h4>Add New Repair Record</h4>
              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  background: "#e3f2fd",
                  borderRadius: "4px",
                }}
              >
                <strong>Repair Instructor:</strong>{" "}
                {user?.username || "Not logged in"}
                <span
                  style={{
                    marginLeft: "10px",
                    fontSize: "0.85rem",
                    color: "#666",
                  }}
                >
                  (Auto-filled with your username)
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "15px",
                  marginTop: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Start Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={newRepair.start_date}
                    onChange={(e) =>
                      setNewRepair({ ...newRepair, start_date: e.target.value })
                    }
                    className="meeting-input"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Finished Date
                  </label>
                  <input
                    type="date"
                    value={newRepair.finished_date}
                    onChange={(e) =>
                      setNewRepair({
                        ...newRepair,
                        finished_date: e.target.value,
                      })
                    }
                    className="meeting-input"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Repair Reason <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newRepair.repair_reason}
                    onChange={(e) =>
                      setNewRepair({
                        ...newRepair,
                        repair_reason: e.target.value,
                      })
                    }
                    placeholder="e.g. Leak repair"
                    className="meeting-input"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Repaired Areas
                  </label>
                  <input
                    type="text"
                    value={newRepair.repaired_areas}
                    onChange={(e) =>
                      setNewRepair({
                        ...newRepair,
                        repaired_areas: e.target.value,
                      })
                    }
                    placeholder="Areas repaired"
                    className="meeting-input"
                  />
                </div>
                {/* <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Repair Team
                  </label>
                  <input
                    type="text"
                    value={newRepair.repair_team}
                    onChange={(e) =>
                      setNewRepair({
                        ...newRepair,
                        repair_team: e.target.value,
                      })
                    }
                    placeholder="Team Name"
                    className="meeting-input"
                  />
                </div> */}
                {/* <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Vehicle
                  </label>
                  <input
                    type="text"
                    value={newRepair.vehicle}
                    onChange={(e) =>
                      setNewRepair({ ...newRepair, vehicle: e.target.value })
                    }
                    placeholder="Vehicle ID"
                    className="meeting-input"
                  />
                </div> */}
                {/* <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Driver
                  </label>
                  <input
                    type="text"
                    value={newRepair.driver}
                    onChange={(e) =>
                      setNewRepair({ ...newRepair, driver: e.target.value })
                    }
                    placeholder="Driver Name"
                    className="meeting-input"
                  />
                </div> */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Note
                  </label>
                  <input
                    type="text"
                    value={newRepair.note}
                    onChange={(e) =>
                      setNewRepair({ ...newRepair, note: e.target.value })
                    }
                    placeholder="Additional notes"
                    className="meeting-input"
                  />
                </div>
                {/* <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Report
                  </label>
                  <input
                    type="text"
                    value={newRepair.report}
                    onChange={(e) =>
                      setNewRepair({ ...newRepair, report: e.target.value })
                    }
                    placeholder="Report Link/ID"
                    className="meeting-input"
                  />
                </div> */}
                {/* <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Invoice
                  </label>
                  <input
                    type="text"
                    value={newRepair.invoice}
                    onChange={(e) =>
                      setNewRepair({ ...newRepair, invoice: e.target.value })
                    }
                    placeholder="Invoice #"
                    className="meeting-input"
                  />
                </div> */}
              </div>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  className="btn-add-meeting"
                  onClick={handleAddRepairRecord}
                >
                  Add Repair Record
                </button>
                <button
                  className="btn-cancel-meeting"
                  onClick={() => {
                    setShowAddRepair(false);
                    resetNewRepairForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Repair Records Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="meetings-table" style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>Start Date</th>
                  <th style={{ width: "5%" }}>Finished Date</th>
                  <th>Repair Reason</th>
                  <th style={{ width: "10%" }}>Repaired Areas</th>
                  <th style={{ width: "5%" }}>Repair Instructor</th>
                  {/* <th>Repair Team</th>
                  <th>Vehicle</th>
                  <th>Driver</th> */}
                  <th style={{ width: "20%" }}>Remarks</th>
                  <th>Job Card</th>
                  <th>Report</th>
                  <th>Invoice</th>
                  {isAdmin && <th style={{ width: "80px" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {repairRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {isAdmin ? (
                        <input
                          type="date"
                          value={record.start_date}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "start_date",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>
                          {record.start_date
                            ? new Date(record.start_date).toLocaleDateString()
                            : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      {isAdmin ? (
                        <input
                          type="date"
                          value={record.finished_date}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "finished_date",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>
                          {record.finished_date
                            ? new Date(
                                record.finished_date,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.repair_reason}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "repair_reason",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.repair_reason}</span>
                      )}
                    </td>
                    <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.repaired_areas}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "repaired_areas",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.repaired_areas}</span>
                      )}
                    </td>
                    <td>
                      <span>{record.repair_instructor}</span>
                    </td>
                    {/* <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.repair_team}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "repair_team",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.repair_team}</span>
                      )}
                    </td> */}
                    {/* <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.vehicle}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "vehicle",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.vehicle}</span>
                      )}
                    </td> */}
                    {/* <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.driver}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "driver",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.driver}</span>
                      )}
                    </td> */}
                    <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.note}
                          onChange={(e) =>
                            handleUpdateRepairRecord(
                              record.id,
                              "note",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.note}</span>
                      )}
                    </td>

                    <SystemRepairJobCardCell
                      record={record}
                      customerId={customerId || ""}
                      onRefresh={fetchRepairRecords}
                      isAdmin={isAdmin}
                    />

                    <FileAttachmentCell
                      recordId={record.id}
                      customerId={customerId || ""}
                      endpoint="report"
                      filename={record.report_filename}
                      fileData={record.report_data}
                      fileMime={record.report_mime}
                      icon="📄"
                      onRefresh={fetchRepairRecords}
                      isAdmin={isAdmin}
                    />
                    <FileAttachmentCell
                      recordId={record.id}
                      customerId={customerId || ""}
                      endpoint="invoice"
                      filename={record.invoice_filename}
                      fileData={record.invoice_data}
                      fileMime={record.invoice_mime}
                      icon="🧾"
                      onRefresh={fetchRepairRecords}
                      isAdmin={isAdmin}
                    />
                    {isAdmin && (
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteRepairRecord(record.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {repairRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 12 : 11}
                      style={{
                        textAlign: "center",
                        color: "#999",
                        padding: "40px",
                      }}
                    >
                      No repair records yet. Click "+ Add Repair" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemRepairDashboard;

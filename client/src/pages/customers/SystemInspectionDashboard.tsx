// ============================================
// System Inspection Dashboard
// Save as: client/src/pages/customers/SystemInspectionDashboard.tsx
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

interface InspectionRecord {
  id: number;
  inspected_date: string;
  inspected_reason: string;
  inspected_areas: string;
  inspection_engineer: string;
  inspection_team: string;
  // vehicle: string;
  driver: string;
  inspection_summary: string;
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

const SystemInspectionDashboard = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [inspectionRecords, setInspectionRecords] = useState<
    InspectionRecord[]
  >([]);
  const [showAddInspection, setShowAddInspection] = useState(false);

  const [newInspection, setNewInspection] = useState<Partial<InspectionRecord>>(
    {
      inspected_date: "",
      inspected_reason: "",
      inspected_areas: "",
      inspection_engineer: "",
      inspection_team: "",
      //vehicle: "",
      driver: "",
      inspection_summary: "",
    },
  );

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

    fetchInspectionRecords();
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

  const fetchInspectionRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/customers/${customerId}/system-inspection/records`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setInspectionRecords(response.data.records || []);
    } catch (error) {
      console.error("Error fetching inspection records:", error);
      setInspectionRecords([]);
    }
  };

  const handleAddInspectionRecord = async () => {
    if (!newInspection.inspected_date || !newInspection.inspected_reason) {
      alert("Please fill in at least Inspected Date and Inspected Reason");
      return;
    }

    const inspectionRecordData = {
      ...newInspection,
      inspection_engineer: user?.username || "Unknown User",
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/customers/${customerId}/system-inspection/records`,
        inspectionRecordData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("System inspection record added successfully!");
        setShowAddInspection(false);
        resetNewInspectionForm();
        fetchInspectionRecords();
      }
    } catch (error) {
      console.error("Error adding inspection record:", error);
      alert("Failed to add inspection record");
    }
  };

  const resetNewInspectionForm = () => {
    setNewInspection({
      inspected_date: "",
      inspected_reason: "",
      inspected_areas: "",
      inspection_engineer: "",
      inspection_team: "",
      //vehicle: "",
      driver: "",
      inspection_summary: "",
    });
  };

  const handleUpdateInspectionRecord = (
    id: number,
    field: keyof InspectionRecord,
    value: string,
  ) => {
    if (!isAdmin) {
      alert("Only admins can edit inspection records");
      return;
    }
    setInspectionRecords(
      inspectionRecords.map((record) =>
        record.id === id ? { ...record, [field]: value } : record,
      ),
    );
  };

  const handleDeleteInspectionRecord = async (id: number) => {
    if (!isAdmin) {
      alert("Only admins can delete inspection records");
      return;
    }

    if (!confirm("Delete this inspection record?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/customers/${customerId}/system-inspection/records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Inspection record deleted!");
      fetchInspectionRecords();
    } catch (error) {
      console.error("Error deleting inspection record:", error);
      alert("Failed to delete inspection record");
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

  const InspectionFileCell = ({
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
      if (file.size > 100 * 1024 * 1024) {
        alert("File must be under 10MB");
        return;
      }
      setUploading(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve((reader.result as string).split(",")[1]);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        const token = localStorage.getItem("token");
        await axios.post(
          `http://localhost:5000/api/customers/${customerId}/system-inspection/records/${recordId}/${endpoint}`,
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
          `http://localhost:5000/api/customers/${customerId}/system-inspection/records/${recordId}/${endpoint}`,
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
          <h2>System Inspection</h2>
          <button className="btn-back" onClick={handleBack}>
            ← Back
          </button>
        </div>

        {/* System Inspection Records Section */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Inspection Records</h3>
            <button
              className="btn-add-small"
              onClick={() => setShowAddInspection(!showAddInspection)}
            >
              + Add Inspection
            </button>
          </div>

          {/* Add Inspection Form */}
          {showAddInspection && (
            <div
              className="add-service-form"
              style={{
                marginBottom: "20px",
                padding: "20px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h4>Add New Inspection Record</h4>
              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  background: "#e3f2fd",
                  borderRadius: "4px",
                }}
              >
                <strong>Inspection Engineer:</strong>{" "}
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
                    Inspected Date <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={newInspection.inspected_date}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        inspected_date: e.target.value,
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
                    Inspected Reason <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newInspection.inspected_reason}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        inspected_reason: e.target.value,
                      })
                    }
                    placeholder="e.g. Regular inspection"
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
                    Inspected Areas
                  </label>
                  <input
                    type="text"
                    value={newInspection.inspected_areas}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        inspected_areas: e.target.value,
                      })
                    }
                    placeholder="Areas inspected"
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
                    Inspection Team
                  </label>
                  <input
                    type="text"
                    value={newInspection.inspection_team}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        inspection_team: e.target.value,
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
                    value={newInspection.vehicle}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        vehicle: e.target.value,
                      })
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
                    value={newInspection.driver}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        driver: e.target.value,
                      })
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
                    Inspection Summary
                  </label>
                  <input
                    type="text"
                    value={newInspection.inspection_summary}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        inspection_summary: e.target.value,
                      })
                    }
                    placeholder="Summary"
                    className="meeting-input"
                  />
                </div>
              </div>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  className="btn-add-meeting"
                  onClick={handleAddInspectionRecord}
                >
                  Add Inspection Record
                </button>
                <button
                  className="btn-cancel-meeting"
                  onClick={() => {
                    setShowAddInspection(false);
                    resetNewInspectionForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Inspection Records Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="meetings-table" style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>Inspected Date</th>
                  <th>Inspected Reason</th>
                  <th style={{ width: "10%" }}>Inspected Areas</th>
                  <th style={{ width: "5%" }}>Inspection Engineer</th>
                  {/* <th>Inspection Team</th> */}
                  {/* <th>Vehicle</th> */}
                  {/* <th>Driver</th> */}
                  <th>Inspection Summary</th>
                  <th>Job Card</th>
                  <th>Report</th>
                  <th>Invoice</th>
                  {isAdmin && <th style={{ width: "80px" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {inspectionRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {isAdmin ? (
                        <input
                          type="date"
                          value={record.inspected_date}
                          onChange={(e) =>
                            handleUpdateInspectionRecord(
                              record.id,
                              "inspected_date",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>
                          {record.inspected_date
                            ? new Date(
                                record.inspected_date,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.inspected_reason}
                          onChange={(e) =>
                            handleUpdateInspectionRecord(
                              record.id,
                              "inspected_reason",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.inspected_reason}</span>
                      )}
                    </td>
                    <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.inspected_areas}
                          onChange={(e) =>
                            handleUpdateInspectionRecord(
                              record.id,
                              "inspected_areas",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.inspected_areas}</span>
                      )}
                    </td>
                    <td>
                      <span>{record.inspection_engineer}</span>
                    </td>
                    {/* <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.inspection_team}
                          onChange={(e) =>
                            handleUpdateInspectionRecord(
                              record.id,
                              "inspection_team",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.inspection_team}</span>
                      )}
                    </td> */}
                    {/* <td>
                      {isAdmin ? (
                        <input
                          type="text"
                          value={record.vehicle}
                          onChange={(e) =>
                            handleUpdateInspectionRecord(
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
                            handleUpdateInspectionRecord(
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
                          value={record.inspection_summary}
                          onChange={(e) =>
                            handleUpdateInspectionRecord(
                              record.id,
                              "inspection_summary",
                              e.target.value,
                            )
                          }
                          className="table-input"
                        />
                      ) : (
                        <span>{record.inspection_summary}</span>
                      )}
                    </td>

                    <InspectionFileCell
                      recordId={record.id}
                      customerId={customerId || ""}
                      endpoint="jobcard"
                      filename={record.job_card_filename || ""}
                      fileData={record.job_card_data || ""}
                      fileMime={record.job_card_mime || ""}
                      icon="🗂️"
                      onRefresh={fetchInspectionRecords}
                      isAdmin={isAdmin}
                    />

                    <InspectionFileCell
                      recordId={record.id}
                      customerId={customerId || ""}
                      endpoint="report"
                      filename={record.report_filename || ""}
                      fileData={record.report_data || ""}
                      fileMime={record.report_mime || ""}
                      icon="📄"
                      onRefresh={fetchInspectionRecords}
                      isAdmin={isAdmin}
                    />
                    <InspectionFileCell
                      recordId={record.id}
                      customerId={customerId || ""}
                      endpoint="invoice"
                      filename={record.invoice_filename || ""}
                      fileData={record.invoice_data || ""}
                      fileMime={record.invoice_mime || ""}
                      icon="🧾"
                      onRefresh={fetchInspectionRecords}
                      isAdmin={isAdmin}
                    />
                    {isAdmin && (
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() =>
                            handleDeleteInspectionRecord(record.id)
                          }
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {inspectionRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 11 : 10}
                      style={{
                        textAlign: "center",
                        color: "#999",
                        padding: "40px",
                      }}
                    >
                      No inspection records yet. Click "+ Add Inspection" to
                      create one.
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

export default SystemInspectionDashboard;

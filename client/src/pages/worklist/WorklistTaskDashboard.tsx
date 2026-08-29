// ============================================
// Worklist Tasks Dashboard - Fixed & Styled
// Save as: client/src/pages/worklist/WorklistTasksDashboard.tsx
// ============================================

import React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./WorklistTaskDashboard.css";
import companyLogo from "../../assets/mainlogo.png";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface WorklistTask {
  id: number;
  task_no: number;
  year: number;
  date: string;
  time: string;
  customer_id: number;
  customer_name: string;
  job_type: string;
  job_reference_id: number;
  job_reference_name: string;
  assigned_member: string;
  job_description: string;
  due_date: string;
  update_note: string;
  status: string;
  finish_date: string;
  created_by: string;
  created_at: string;
  has_third_party?: boolean;
  third_party_names?: string | null;
}

interface Customer {
  id: number;
  name: string;
}
interface JobItem {
  id: number;
  name: string;
}
interface SystemUser {
  username: string;
  first_name: string;
  last_name: string;
}

const JOB_TYPES = [
  {
    value: "project",
    label: "Projects",
    path: (cId: number, rId: number) => `/customers/${cId}/projects/${rId}`,
  },
  {
    value: "compressor_service",
    label: "Compressor Service",
    path: (cId: number, rId: number) =>
      `/customers/${cId}/compressor-service/${rId}`,
  },
  {
    value: "compressor_repair",
    label: "Compressor Repair",
    path: (cId: number, rId: number) =>
      `/customers/${cId}/compressor-repair/${rId}`,
  },
  {
    value: "system_repair",
    label: "System Repair",
    path: (cId: number, _rId?: number) => `/customers/${cId}/system-repair`,
  },
  {
    value: "system_inspection",
    label: "System Inspection",
    path: (cId: number, _rId?: number) => `/customers/${cId}/system-inspection`,
  },
];

// Added "permission" as a status stage between on_hold and done.
const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", bg: "#e3f2fd", color: "#2e7d32" },
  {
    value: "in_progress",
    label: "In Progress",
    bg: "#fff8e1",
    color: "#e6db00",
  },
  { value: "on_hold", label: "On Hold", bg: "#fce4ec", color: "#880e4f" },
  {
    value: "permission",
    label: "Permission",
    bg: "#ede7f6",
    color: "#5e35b1",
  },
  { value: "done", label: "Done", bg: "#c0c0c0", color: "#727272" },
];

const getStatus = (val: string) =>
  STATUS_OPTIONS.find((s) => s.value === val) || STATUS_OPTIONS[0];

const fmtDate = (d: string) => {
  if (!d) return "—";

  // Extract just the date part in case it's a full ISO timestamp, then
  // parse the components manually so we never let Date reinterpret a
  // plain "YYYY-MM-DD" as UTC midnight and shift it a day in local time.
  const datePart = d.split("T")[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "—";

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (t: string) => {
  if (!t) return "—";

  const match = t.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "—";

  let [, hoursStr, minutes] = match;
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  return `${hours}:${minutes} ${ampm}`;
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const API = "https://coolmanworkshop-production.up.railway.app/api";

// ── Update Log Component ──────────────────────────────────────
const TaskUpdateLog = ({
  taskId,
  canEdit,
  isAdmin,
  readOnly,
  systemUsers,
  authHeaders,
}: {
  taskId: number;
  canEdit: boolean; // can this user add a new log line right now
  isAdmin: boolean;
  readOnly: boolean; // task is done — fully locked
  systemUsers: SystemUser[];
  authHeaders: () => { Authorization: string };
}) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignOpenFor, setAssignOpenFor] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  const API = "https://coolmanworkshop-production.up.railway.app/api";

  useEffect(() => {
    fetchUpdates();
  }, [taskId]);

  const fetchUpdates = async () => {
    try {
      const r = await axios.get(`${API}/jobAssigned/tasks/${taskId}/updates`, {
        headers: authHeaders(),
      });
      setUpdates(r.data.updates || []);
    } catch {}
  };

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/jobAssigned/tasks/${taskId}/updates`,
        { update_note: newNote },
        { headers: authHeaders() },
      );
      setNewNote("");
      fetchUpdates();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (updateId: number) => {
    if (!confirm("Delete this update?")) return;
    try {
      await axios.delete(
        `${API}/jobAssigned/tasks/${taskId}/updates/${updateId}`,
        { headers: authHeaders() },
      );
      fetchUpdates();
    } catch {}
  };

  const handleAssignThirdParty = async (updateId: number, username: string) => {
    setAssigning(true);
    try {
      await axios.put(
        `${API}/jobAssigned/tasks/${taskId}/updates/${updateId}/third-party`,
        { third_party: username },
        { headers: authHeaders() },
      );
      setAssignOpenFor(null);
      fetchUpdates();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to assign");
    } finally {
      setAssigning(false);
    }
  };

  // Postgres's CURRENT_TIMESTAMP on a "timestamp without time zone" column
  // is stored as a true UTC instant, but comes back over the API as a bare
  // string with no timezone marker (no "Z", no offset). JS's Date parser
  // treats a marker-less string as *already local* and applies zero
  // conversion — so without this normalization the UI would just echo the
  // raw UTC digits, which is exactly the mismatch being seen. We explicitly
  // mark it UTC before parsing so the browser converts it to real local time.
  const fmtLogDateTime = (raw: string) => {
    if (!raw) return { date: "—", time: "—" };
    const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
    const isoString = hasTimezone ? raw : `${raw.replace(" ", "T")}Z`;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "—", time: "—" };
    return {
      date: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.6px",
          color: "#667eea",
          marginBottom: "8px",
          paddingBottom: "6px",
          borderBottom: "2px solid #e8f0fe",
        }}
      >
        Update Log
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          marginBottom: "10px",
        }}
      >
        <thead>
          <tr style={{ background: "#f8f9ff" }}>
            <th style={thStyle("90px")}>Date</th>
            <th style={thStyle("70px")}>Time</th>
            <th style={thStyle("80px")}>By</th>
            <th style={thStyle()}>Update</th>
            <th style={thStyle("100px")}>Status</th>
            <th style={thStyle("120px")}>Third Party</th>
            {isAdmin && (
              <th style={{ ...thStyle("40px"), padding: "6px 10px" }}></th>
            )}
          </tr>
        </thead>
        <tbody>
          {updates.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 7 : 6}
                style={{
                  padding: "16px 10px",
                  textAlign: "center" as const,
                  color: "#bbb",
                  fontStyle: "italic",
                }}
              >
                No updates yet
              </td>
            </tr>
          ) : (
            updates.map((u, idx) => {
              const rowStatus = getStatus(u.status || "todo");
              const { date: logDate, time: logTime } = fmtLogDateTime(
                u.created_at,
              );
              return (
                <tr
                  key={u.id}
                  style={{ background: idx % 2 === 0 ? "#fff" : "#fafbff" }}
                >
                  <td style={tdStyle}>{logDate}</td>
                  <td style={tdStyle}>{logTime}</td>
                  <td style={{ ...tdStyle, color: "#888", fontSize: "12px" }}>
                    {u.created_by || "—"}
                  </td>
                  <td style={{ ...tdStyle, color: "#333" }}>{u.update_note}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "9px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: rowStatus.bg,
                        color: rowStatus.color,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {rowStatus.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, position: "relative" as const }}>
                    {u.third_party ? (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#c62828",
                        }}
                      >
                        @{u.third_party}
                      </span>
                    ) : !readOnly ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignOpenFor(
                            assignOpenFor === u.id ? null : u.id,
                          );
                        }}
                        style={{
                          background: "none",
                          border: "1px dashed #bbb",
                          borderRadius: "5px",
                          color: "#888",
                          fontSize: "12px",
                          padding: "2px 8px",
                          cursor: "pointer",
                        }}
                      >
                        @ Assign
                      </button>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>
                    )}

                    {assignOpenFor === u.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          zIndex: 20,
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                          minWidth: "180px",
                          maxHeight: "220px",
                          overflowY: "auto" as const,
                          marginTop: "4px",
                        }}
                      >
                        {systemUsers.length === 0 ? (
                          <div
                            style={{
                              padding: "10px",
                              fontSize: "12px",
                              color: "#999",
                            }}
                          >
                            No members found
                          </div>
                        ) : (
                          systemUsers.map((su) => (
                            <div
                              key={su.username}
                              onClick={() =>
                                !assigning &&
                                handleAssignThirdParty(u.id, su.username)
                              }
                              style={{
                                padding: "8px 12px",
                                fontSize: "13px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f2f2f2",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f8f9ff")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "")
                              }
                            >
                              {su.first_name} {su.last_name}{" "}
                              <span style={{ color: "#aaa" }}>
                                ({su.username})
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ ...tdStyle, textAlign: "center" as const }}>
                      {!readOnly && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ddd",
                            fontSize: "14px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#ef4444")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#ddd")
                          }
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Add new update row */}
      {canEdit && !readOnly && (
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add update note..."
            rows={2}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: "13px",
              border: "1.5px solid #ddd",
              borderRadius: "6px",
              resize: "vertical" as const,
              fontFamily: "inherit",
              boxSizing: "border-box" as const,
            }}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newNote.trim()}
            style={{
              padding: "8px 16px",
              background: "#667eea",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              whiteSpace: "nowrap" as const,
              opacity: !newNote.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "..." : "+ Add"}
          </button>
        </div>
      )}
      {!canEdit && !readOnly && (
        <div style={{ fontSize: "12px", color: "#aaa", fontStyle: "italic" }}>
          Move this task to In Progress to start adding updates.
        </div>
      )}
    </div>
  );
};

const thStyle = (width?: string) => ({
  padding: "6px 10px",
  textAlign: "left" as const,
  fontSize: "11px",
  fontWeight: 600,
  color: "#888",
  borderBottom: "1px solid #e8e8e8",
  ...(width ? { width } : {}),
});

const tdStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  color: "#555",
  borderBottom: "1px solid #f0f0f0",
};

const WorklistTasksDashboard = () => {
  const navigate = useNavigate();
  const { year } = useParams<{ year: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<WorklistTask[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    customer_name: "",
    job_type: "",
    job_reference_id: "",
    job_reference_name: "",
    assigned_member: "",
    job_description: "",
    due_date: "",
    status: "todo",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorklistTask | null>(null);

  const isAdmin = user?.role === "admin";
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchTasks();
    fetchDropdownData();
  }, [year]);

  useEffect(() => {
    if (form.customer_id && form.job_type) {
      fetchJobItems(form.customer_id, form.job_type);
    } else {
      setJobItems([]);
    }
    setForm((f) => ({ ...f, job_reference_id: "", job_reference_name: "" }));
  }, [form.customer_id, form.job_type]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/jobAssigned/tasks/${year}`, {
        headers: authHeaders(),
      });
      setTasks(res.data.tasks || []);
    } catch {
      setTasks([]);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [custRes, userRes] = await Promise.all([
        axios.get(`${API}/worklist/dropdown/customers`, {
          headers: authHeaders(),
        }),
        axios.get(`${API}/worklist/dropdown/users`, { headers: authHeaders() }),
      ]);
      setCustomers(custRes.data.customers || []);
      setSystemUsers(userRes.data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobItems = async (customerId: string, jobType: string) => {
    if (!customerId || !jobType) {
      setJobItems([]);
      return;
    }
    const endpointMap: Record<string, string> = {
      project: "projects",
      compressor_service: "compressor-service",
      compressor_repair: "compressor-repair",
      system_repair: "system-repair",
      system_inspection: "system-inspection",
    };
    try {
      const res = await axios.get(
        `${API}/worklist/dropdown/customers/${customerId}/${endpointMap[jobType]}`,
        { headers: authHeaders() },
      );
      setJobItems(res.data.projects || res.data.items || []);
    } catch {
      setJobItems([]);
    }
  };

  const handleAddTask = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${API}/jobAssigned/tasks`,
        { ...form, year: parseInt(year || "0") },
        { headers: authHeaders() },
      );
      setShowAdd(false);
      setForm({
        customer_id: "",
        customer_name: "",
        job_type: "",
        job_reference_id: "",
        job_reference_name: "",
        assigned_member: "",
        job_description: "",
        due_date: "",
        status: "todo",
      });
      fetchTasks();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocal = (taskId: number, field: string, value: string) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
    );
  };

  const handleSave = async (taskId: number, field: string, value: string) => {
    try {
      await axios.put(
        `${API}/jobAssigned/tasks/${taskId}`,
        { [field]: value },
        { headers: authHeaders() },
      );
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to save");
      fetchTasks();
    }
  };

  // Status changes go through here so "done" can auto-stamp finish_date
  // in one request, and so a revert-to-todo never reaches the server.
  const handleStatusChange = async (task: WorklistTask, newStatus: string) => {
    if (newStatus === "todo" && task.status !== "todo") {
      alert("A task can't be moved back to To Do once it has started.");
      return;
    }

    const updates: Record<string, string> = { status: newStatus };
    if (newStatus === "done" && !task.finish_date) {
      updates.finish_date = todayISO();
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)),
    );

    try {
      await axios.put(`${API}/jobAssigned/tasks/${task.id}`, updates, {
        headers: authHeaders(),
      });
      fetchTasks();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to update status");
      fetchTasks();
    }
  };

  const handleDelete = async (task: WorklistTask) => {
    try {
      await axios.delete(`${API}/jobAssigned/tasks/${task.id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchTasks();
    } catch {
      alert("Failed to delete task");
    }
  };

  const getJobLink = (task: WorklistTask): string | null => {
    if (!task.customer_id || !task.job_type) return null;
    const jt = JOB_TYPES.find((j) => j.value === task.job_type);
    if (!jt) return null;
    return jt.path(task.customer_id, task.job_reference_id ?? 0);
  };

  const handleNavigateToJob = async (
    e: React.MouseEvent,
    task: WorklistTask,
  ) => {
    e.stopPropagation();
    const link = getJobLink(task);
    if (!link) return;

    try {
      const custRes = await axios.get(`${API}/customers/${task.customer_id}`, {
        headers: authHeaders(),
      });
      const customer = custRes.data.customer || {
        id: task.customer_id,
        name: task.customer_name,
      };

      let state: Record<string, any> = { customer };

      if (task.job_reference_id && task.job_type === "compressor_repair") {
        try {
          const compRes = await axios.get(
            `${API}/customers/${task.customer_id}/compressor-repair`,
            { headers: authHeaders() },
          );
          const companies =
            compRes.data.companies || compRes.data.repairs || [];
          const company = companies.find(
            (c: any) => c.id === Number(task.job_reference_id),
          );
          if (company) state.company = company;
        } catch {}
      }

      if (task.job_reference_id && task.job_type === "compressor_service") {
        try {
          const compRes = await axios.get(
            `${API}/customers/${task.customer_id}/compressor-service`,
            { headers: authHeaders() },
          );
          const companies =
            compRes.data.companies || compRes.data.services || [];
          const company = companies.find(
            (c: any) => c.id === Number(task.job_reference_id),
          );
          if (company) state.company = company;
        } catch {}
      }

      if (task.job_reference_id && task.job_type === "project") {
        try {
          const projRes = await axios.get(
            `${API}/customers/${task.customer_id}/projects/${task.job_reference_id}`,
            { headers: authHeaders() },
          );
          if (projRes.data.project) state.project = projRes.data.project;
        } catch {}
      }

      navigate(link, { state });
    } catch {
      navigate(link, {
        state: { customer: { id: task.customer_id, name: task.customer_name } },
      });
    }
  };

  // Search also matches a third-party assignee's name (e.g. "maduranga"
  // surfaces a task even if he's only handed off on one of its log lines).
  const filtered = tasks
    .filter(
      (t) =>
        !search ||
        String(t.task_no).includes(search) ||
        (t.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.assigned_member || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (t.job_description || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (t.third_party_names || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    // Completed tasks sink to the bottom; task_no is never touched.
    .sort((a, b) => {
      const aDone = a.status === "done" ? 1 : 0;
      const bDone = b.status === "done" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return a.task_no - b.task_no;
    });

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
    for (let i = 0; i < name.length; i++)
      h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
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
            <img src={companyLogo} alt="Logo" className="company-logo" />
          </div>
          <h1 className="portal-title" onClick={() => navigate("/dashboard")}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span
            style={{
              background: "#667eea",
              color: "#fff",
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            📅 {year}
          </span>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="project-main-content">
        <div className="project-header-row">
          <h2>Job Assigned — {year}</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-back" onClick={() => navigate("/worklist")}>
              ← Back to Years
            </button>
            <button className="btn-add-small" onClick={() => setShowAdd(true)}>
              + Add Task
            </button>
          </div>
        </div>

        <div className="project-section">
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search by task no, customer, member, third party, description..."
              style={{
                flex: 1,
                minWidth: "240px",
                maxWidth: "500px",
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
              {filtered.length} task{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Status legend */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <span
                key={s.value}
                style={{
                  padding: "3px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: s.bg,
                  color: s.color,
                }}
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#999",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📋</div>
              <h3 style={{ color: "#666", marginBottom: "8px" }}>
                {search ? "No tasks match your search" : `No tasks for ${year}`}
              </h3>
              {!search && (
                <button
                  className="btn-add-meeting"
                  style={{ marginTop: "12px" }}
                  onClick={() => setShowAdd(true)}
                >
                  + Add First Task
                </button>
              )}
            </div>
          ) : (
            <table className="meetings-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "55px" }}>No</th>
                  <th style={{ width: "110px" }}>Date</th>
                  <th style={{ width: "75px" }}>Time</th>
                  <th style={{ width: "160px" }}>Customer</th>
                  <th style={{ width: "200px" }}>Job</th>
                  <th style={{ width: "140px" }}>Assigned To</th>
                  <th>Description</th>
                  <th style={{ width: "110px" }}>Due Date</th>
                  <th style={{ width: "110px" }}>Finish Date</th>
                  <th style={{ width: "105px" }}>Status</th>
                  <th style={{ width: "36px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const isExpanded = expandedId === task.id;
                  const st = getStatus(task.status);
                  const isDone = task.status === "done";
                  const isAssignedToMe =
                    task.assigned_member === user?.username;
                  const canEditUpdate = !isDone && task.status !== "todo";
                  const jobLink = getJobLink(task);
                  const jobTypeLabel = JOB_TYPES.find(
                    (j) => j.value === task.job_type,
                  )?.label;

                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        key={task.id}
                        style={{
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: isExpanded ? "#f8f9ff" : "",
                          opacity: isDone ? 0.55 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded && !isDone)
                            e.currentTarget.style.background = "#f8f9ff";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded)
                            e.currentTarget.style.background = "";
                        }}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : task.id)
                        }
                      >
                        {/* No */}
                        <td
                          style={{
                            textAlign: "center",
                            fontWeight: 700,
                            color: "#667eea",
                            fontSize: "15px",
                          }}
                        >
                          #{task.task_no}
                        </td>

                        {/* Date */}
                        <td
                          style={{
                            fontSize: "14px",
                            color: "#555",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fmtDate(task.date)}
                        </td>

                        {/* Time */}
                        <td style={{ fontSize: "14px", color: "#555" }}>
                          {fmtTime(task.time)}
                        </td>

                        {/* Customer */}
                        <td>
                          {task.customer_name ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  flexShrink: 0,
                                  background: getColor(task.customer_name),
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                }}
                              >
                                {getInitials(task.customer_name)}
                              </div>
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {task.customer_name}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#bbb", fontSize: "13px" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Job */}
                        <td>
                          {jobTypeLabel ? (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#888",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.4px",
                                  fontWeight: 600,
                                }}
                              >
                                {jobTypeLabel}
                              </div>
                              {task.job_reference_name && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#333",
                                    marginTop: "1px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {task.job_reference_name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#bbb", fontSize: "13px" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Assigned To */}
                        <td>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: isAssignedToMe ? 700 : 400,
                              color: isAssignedToMe ? "#667eea" : "#333",
                            }}
                          >
                            {task.assigned_member || "—"}
                            {isAssignedToMe && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#888",
                                  marginLeft: "3px",
                                }}
                              >
                                (you)
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Description */}
                        <td
                          style={{
                            fontSize: "14px",
                            color: "#555",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "0",
                          }}
                        >
                          {task.job_description || "—"}
                        </td>

                        {/* Due Date */}
                        <td
                          style={{
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                            color:
                              task.due_date &&
                              new Date(task.due_date) < new Date() &&
                              task.status !== "done"
                                ? "#f44336"
                                : "#555",
                          }}
                        >
                          {fmtDate(task.due_date)}
                        </td>

                        {/* Finish Date — always read-only, server-computed */}
                        <td
                          style={{
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                            color: "#555",
                          }}
                        >
                          {task.finish_date ? fmtDate(task.finish_date) : "—"}
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: st.bg,
                              color: st.color,
                              whiteSpace: "nowrap",
                              display: "inline-block",
                            }}
                          >
                            {st.label}
                          </span>
                        </td>

                        {/* Expand toggle — red when a third party is assigned */}
                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              color: task.has_third_party ? "#f44336" : "#999",
                              fontSize: "12px",
                              fontWeight: task.has_third_party ? 700 : 400,
                              transition: "transform 0.2s",
                              transform: isExpanded
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                            }}
                            title={
                              task.has_third_party
                                ? `Assigned to third party: ${task.third_party_names}`
                                : undefined
                            }
                          >
                            ▶
                          </span>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${task.id}-detail`}>
                          <td
                            colSpan={11}
                            style={{ padding: 0, background: "#fafbff" }}
                          >
                            <div
                              style={{
                                padding: "20px 24px",
                                borderTop: "2px solid #667eea20",
                                borderBottom: "1px solid #e8e8e8",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "280px 1fr",
                                  gap: "24px",
                                }}
                              >
                                {/* Finish Date + Status */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        textTransform: "uppercase" as const,
                                        letterSpacing: "0.6px",
                                        color: "#667eea",
                                        marginBottom: "8px",
                                        paddingBottom: "6px",
                                        borderBottom: "2px solid #e8f0fe",
                                      }}
                                    >
                                      Finish Date
                                    </div>
                                    <span style={{ fontSize: "14px" }}>
                                      {fmtDate(task.finish_date)}
                                    </span>
                                  </div>

                                  <div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        textTransform: "uppercase" as const,
                                        letterSpacing: "0.6px",
                                        color: "#667eea",
                                        marginBottom: "8px",
                                        paddingBottom: "6px",
                                        borderBottom: "2px solid #e8f0fe",
                                      }}
                                    >
                                      Status
                                    </div>
                                    {isDone ? (
                                      <span
                                        style={{
                                          padding: "3px 10px",
                                          borderRadius: "10px",
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          background: st.bg,
                                          color: st.color,
                                        }}
                                      >
                                        {st.label}
                                      </span>
                                    ) : (
                                      <select
                                        value={task.status}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleStatusChange(
                                            task,
                                            e.target.value,
                                          );
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          width: "100%",
                                          padding: "7px 10px",
                                          fontSize: "13px",
                                          border: "1.5px solid #ddd",
                                          borderRadius: "6px",
                                          background: st.bg,
                                          color: st.color,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          boxSizing: "border-box" as const,
                                        }}
                                      >
                                        {STATUS_OPTIONS.filter(
                                          (s) =>
                                            task.status === "todo" ||
                                            s.value !== "todo",
                                        ).map((s) => (
                                          <option key={s.value} value={s.value}>
                                            {s.label}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    {!isDone && task.status !== "todo" && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#aaa",
                                          marginTop: "4px",
                                        }}
                                      >
                                        Can't be moved back to To Do
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Update Log */}
                                <div>
                                  <TaskUpdateLog
                                    taskId={task.id}
                                    canEdit={canEditUpdate}
                                    isAdmin={isAdmin}
                                    readOnly={isDone}
                                    systemUsers={systemUsers}
                                    authHeaders={authHeaders}
                                  />
                                </div>
                              </div>

                              {/* Bottom bar */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginTop: "16px",
                                  paddingTop: "14px",
                                  borderTop: "1px solid #f0f0f0",
                                  flexWrap: "wrap",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}
                                >
                                  <span
                                    style={{ fontSize: "13px", color: "#888" }}
                                  >
                                    Created by:{" "}
                                    <strong>{task.created_by || "—"}</strong>
                                  </span>
                                  {jobLink && (
                                    <button
                                      onClick={(e) =>
                                        handleNavigateToJob(e, task)
                                      }
                                      style={{
                                        padding: "6px 14px",
                                        background: "#667eea",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      🔗 Open {jobTypeLabel}
                                      {task.job_reference_name
                                        ? ` — ${task.job_reference_name}`
                                        : ""}
                                    </button>
                                  )}
                                </div>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget(task);
                                    }}
                                    style={{
                                      padding: "6px 14px",
                                      background: "#fff",
                                      color: "#c62828",
                                      border: "1px solid #ef9a9a",
                                      borderRadius: "7px",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    🗑️ Delete Task
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Task Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div
            className="modal-content-large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px" }}
          >
            <div className="modal-header">
              <h2>+ Add Task — {year}</h2>
              <button
                className="close-button"
                onClick={() => setShowAdd(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                {[
                  {
                    label: "Customer",
                    full: false,
                    el: (
                      <select
                        value={form.customer_id}
                        onChange={(e) => {
                          const c = customers.find(
                            (c) => c.id === Number(e.target.value),
                          );
                          setForm((f) => ({
                            ...f,
                            customer_id: e.target.value,
                            customer_name: c?.name || "",
                            job_type: "",
                            job_reference_id: "",
                            job_reference_name: "",
                          }));
                        }}
                        className="form-input"
                      >
                        <option value="">Select customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    label: "Job Type",
                    full: false,
                    el: (
                      <select
                        value={form.job_type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            job_type: e.target.value,
                            job_reference_id: "",
                            job_reference_name: "",
                          }))
                        }
                        className="form-input"
                        disabled={!form.customer_id}
                      >
                        <option value="">Select job type...</option>
                        {JOB_TYPES.map((j) => (
                          <option key={j.value} value={j.value}>
                            {j.label}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                ].map(({ label, full, el }) => (
                  <div
                    key={label}
                    className={`form-group${full ? " full-width" : ""}`}
                  >
                    <label>{label}</label>
                    {el}
                  </div>
                ))}

                {form.job_type && jobItems.length > 0 && (
                  <div className="form-group full-width">
                    <label>
                      Select{" "}
                      {JOB_TYPES.find((j) => j.value === form.job_type)?.label}
                    </label>
                    <select
                      value={form.job_reference_id}
                      onChange={(e) => {
                        const item = jobItems.find(
                          (i) => i.id === Number(e.target.value),
                        );
                        setForm((f) => ({
                          ...f,
                          job_reference_id: e.target.value,
                          job_reference_name: item?.name || "",
                        }));
                      }}
                      className="form-input"
                    >
                      <option value="">Select...</option>
                      {jobItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Assign To</label>
                  <select
                    value={form.assigned_member}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        assigned_member: e.target.value,
                      }))
                    }
                    className="form-input"
                  >
                    <option value="">Select member...</option>
                    {systemUsers.map((u) => (
                      <option key={u.username} value={u.username}>
                        {u.first_name} {u.last_name} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, due_date: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="form-input"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Job Description</label>
                  <textarea
                    value={form.job_description}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        job_description: e.target.value,
                      }))
                    }
                    className="form-input"
                    rows={3}
                    placeholder="Describe the job..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAddTask}
                disabled={saving}
              >
                {saving ? "⏳ Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🗑️ Delete Task</h2>
              <button
                className="close-button"
                onClick={() => setDeleteTarget(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete task{" "}
                <strong>#{deleteTarget.task_no}</strong>?
              </p>
              <p
                style={{
                  color: "#f44336",
                  marginTop: "10px",
                  fontSize: "0.88rem",
                }}
              >
                This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={() => handleDelete(deleteTarget)}
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

export default WorklistTasksDashboard;

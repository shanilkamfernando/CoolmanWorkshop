// ============================================
// Worklist Tasks Dashboard - Fixed & Styled
// Save as: client/src/pages/worklist/MyTasksDashboard.tsx
// ============================================

import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  is_third_party_assignment?: boolean;
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

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", bg: "#e3f2fd", color: "#2e7d32" },
  {
    value: "in_progress",
    label: "In Progress",
    bg: "#fff8e1",
    color: "##e6bc00",
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

  const datePart = d.split("T")[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return "—";

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
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
  task,
  status,
  refreshKey,
  description,
  canEdit,
  readOnly,
  systemUsers,
  authHeaders,
  onUpdateAdded,
}: {
  task: WorklistTask;
  status: string;
  refreshKey: number;
  description: string;
  canEdit: boolean;
  readOnly: boolean;
  systemUsers: SystemUser[];
  authHeaders: () => { Authorization: string };
  onUpdateAdded: () => void;
}) => {
  const taskId = task.id;
  const [updates, setUpdates] = useState<any[]>([]);
  const updatesRequest = React.useRef(0);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [newThirdParties, setNewThirdParties] = useState<string[]>([]);
  const [thirdPartySearch, setThirdPartySearch] = useState("");

  useEffect(() => {
    fetchUpdates();
    // Refetch whenever the task's status changes — this covers the
    // server's auto-inserted "Task Completed" row the moment a task is
    // marked done, without requiring the row to be collapsed/reopened.
  }, [taskId, status, refreshKey]);

  const fetchUpdates = async () => {
    const requestId = ++updatesRequest.current;
    try {
      const r = await axios.get(`${API}/jobAssigned/tasks/${taskId}/updates`, {
        headers: authHeaders(),
      });
      if (requestId === updatesRequest.current) {
        setUpdates(r.data.updates || []);
      }
    } catch {}
  };

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/jobAssigned/tasks/${taskId}/updates`,
        { update_note: newNote, third_parties: newThirdParties },
        { headers: authHeaders() },
      );
      setNewNote("");
      setNewThirdParties([]);
      setThirdPartySearch("");
      fetchUpdates();
      onUpdateAdded();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add update");
    } finally {
      setSaving(false);
    }
  };

  const getThirdParties = (raw: string | null | undefined): string[] =>
    raw
      ? raw
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  const fmtLogDateTime = (raw: string) => {
    if (!raw) return { date: "—", time: "—" };

    const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
    const isoString = hasTimezone ? raw : `${raw.replace(" ", "T")}Z`;

    const d = new Date(isoString);

    if (isNaN(d.getTime())) {
      return { date: "—", time: "—" };
    }

    return {
      date: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),

      time: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const assignedAt = fmtLogDateTime(task.created_at);
  const completedEntry = [...updates]
    .reverse()
    .find(
      (entry) =>
        entry.status === "done" && entry.update_note === "Task Completed",
    );
  const completedAt = completedEntry
    ? fmtLogDateTime(completedEntry.created_at)
    : null;
  const summary = [
    ["Assigned By", task.created_by || "—"],
    ["Assigned To", task.assigned_member || "—"],
    ["Assigned Date", assignedAt.date],
    ["Assigned Time", assignedAt.time],
    ["Finished Date", task.finish_date ? fmtDate(task.finish_date) : "—"],
    ["Finished Time", task.status === "done" ? completedAt?.time || "—" : "—"],
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "8px 16px",
          padding: "10px 12px",
          marginBottom: "12px",
          background: "#f8f9ff",
          border: "1px solid #e8f0fe",
          borderRadius: "6px",
          fontSize: "13px",
        }}
      >
        {summary.map(([label, value]) => (
          <div key={label}>
            <span style={{ color: "#667eea", fontWeight: 700 }}>{label}: </span>
            <span style={{ color: "#333" }}>{value}</span>
          </div>
        ))}
      </div>
      {description && (
        <div
          style={{
            fontSize: "13px",
            color: "#555",
            background: "#f8f9ff",
            border: "1px solid #e8f0fe",
            borderRadius: "6px",
            padding: "8px 12px",
            marginBottom: "12px",
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#667eea",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "3px",
            }}
          >
            Description
          </span>
          {description}
        </div>
      )}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
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
          </tr>
        </thead>
        <tbody>
          {updates.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "16px 10px",
                  textAlign: "center",
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
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rowStatus.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, position: "relative" }}>
                    {getThirdParties(u.third_party).length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {getThirdParties(u.third_party).map((username) => (
                          <span
                            key={username}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#c62828",
                              background: "#fff1f1",
                              border: "1px solid #ffcdd2",
                              borderRadius: "10px",
                              padding: "2px 7px",
                            }}
                          >
                            @{username}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {canEdit && !readOnly && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add update note..."
            rows={2}
            onClick={(e) => e.stopPropagation()}
            className="form-input"
          />
          <div style={{ fontSize: "12px", fontWeight: 600 }}>
            Third-party assignees (optional)
          </div>
          <input
            className="form-input"
            value={thirdPartySearch}
            onChange={(e) => setThirdPartySearch(e.target.value)}
            placeholder="Search members..."
          />
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            {systemUsers
              .filter((su) =>
                `${su.first_name} ${su.last_name} ${su.username}`
                  .toLowerCase()
                  .includes(thirdPartySearch.toLowerCase()),
              )
              .map((su) => (
                <label
                  key={su.username}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "5px 10px",
                    fontSize: "12px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newThirdParties.includes(su.username)}
                    disabled={saving}
                    onChange={(e) =>
                      setNewThirdParties((previous) =>
                        e.target.checked
                          ? [...previous, su.username]
                          : previous.filter(
                              (username) => username !== su.username,
                            ),
                      )
                    }
                  />
                  {su.first_name} {su.last_name} ({su.username})
                </label>
              ))}
          </div>
          <button
            type="button"
            className="btn-save"
            onClick={handleAdd}
            disabled={saving || !newNote.trim()}
          >
            {saving ? "Adding..." : "+ Add"}
          </button>
          <div style={{ fontSize: "11px", color: "#777" }}>
            The update and its assignees cannot be changed after you add it.
          </div>
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

const MyTasksDashboard = () => {
  const navigate = useNavigate();
  const year = String(new Date().getFullYear());

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<WorklistTask[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logRefreshKeys, setLogRefreshKeys] = useState<Record<number, number>>(
    {},
  );
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<WorklistTask | null>(null);

  const isAdmin = user?.role === "admin";
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    const u = localStorage.getItem("user");

    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (error) {
        console.error("Failed to parse user:", error);
      }
    }

    fetchTasks();
    fetchSystemUsers();
  }, [year]);

  const fetchTasks = async (retryCount = 0) => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No authentication token yet.");

      if (retryCount < 3) {
        setTimeout(() => fetchTasks(retryCount + 1), 500);
      }

      return;
    }

    try {
      const res = await axios.get(`${API}/myTasks/tasks/${year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(res.data.tasks || []);
    } catch (error: any) {
      console.error(
        `Failed to fetch tasks (attempt ${retryCount + 1}):`,
        error.response?.status,
        error.response?.data || error.message,
      );

      // Retry automatically
      if (retryCount < 3) {
        setTimeout(() => {
          fetchTasks(retryCount + 1);
        }, 1000);
      }

      // IMPORTANT:
      // Don't do setTasks([]) here.
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const response = await axios.get(`${API}/worklist/dropdown/users`, {
        headers: authHeaders(),
      });
      setSystemUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleStatusChange = async (task: WorklistTask, newStatus: string) => {
    // Cannot move a completed task back to another status
    if (task.status === "done") {
      alert("Completed tasks cannot be changed.");
      return;
    }

    // Cannot move back to To Do
    if (newStatus === "todo" && task.status !== "todo") {
      alert("A task can't be moved back to To Do once it has started.");
      return;
    }

    // The server sets finish_date on Done. Regular users may update status only.
    const updates = { status: newStatus };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              ...updates,
              ...(newStatus === "done" && !t.finish_date
                ? { finish_date: todayISO() }
                : {}),
            }
          : t,
      ),
    );

    try {
      await axios.put(`${API}/jobAssigned/tasks/${task.id}`, updates, {
        headers: authHeaders(),
      });

      setLogRefreshKeys((previous) => ({
        ...previous,
        [task.id]: (previous[task.id] || 0) + 1,
      }));
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

  // Main table date/time formatter (NO timezone conversion)
  function fmtMainDateTime(rawCreatedAt?: string | null): {
    date: string;
    time: string;
  } {
    if (!rawCreatedAt) {
      return { date: "—", time: "—" };
    }

    const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(rawCreatedAt);

    const isoString = hasTimezone
      ? rawCreatedAt
      : `${rawCreatedAt.replace(" ", "T")}Z`;

    const d = new Date(isoString);

    if (isNaN(d.getTime())) {
      return { date: "—", time: "—" };
    }

    return {
      date: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),

      time: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }

  return (
    <div className="project-dashboard">
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

      <div className="project-main-content">
        <div className="project-header-row">
          <h2>My Tasks — {year}</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-back" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="project-section">
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
                {search
                  ? "No tasks match your search"
                  : `No tasks assigned to you for ${year}`}
              </h3>
            </div>
          ) : (
            <table className="meetings-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "55px", textAlign: "center" }}>No</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Date</th>
                  <th style={{ width: "75px", textAlign: "center" }}>Time</th>
                  <th style={{ width: "160px", textAlign: "center" }}>
                    Customer
                  </th>
                  <th style={{ width: "200px", textAlign: "center" }}>Job</th>
                  <th style={{ width: "140px", textAlign: "center" }}>
                    Assigned To
                  </th>
                  <th>Description</th>
                  <th style={{ width: "110px" }}>Due Date</th>
                  <th style={{ width: "110px" }}>Finish Date</th>
                  <th style={{ width: "105px" }}>Status</th>
                  <th style={{ width: "36px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const { date: mainDate, time: mainTime } = fmtMainDateTime(
                    task.created_at,
                  );
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
                        <td
                          style={{
                            fontSize: "14px",
                            color: "#555",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {mainDate}
                        </td>
                        <td style={{ fontSize: "14px", color: "#555" }}>
                          {mainTime}
                        </td>
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

                        <td
                          style={{
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                            color: "#555",
                          }}
                        >
                          {task.finish_date ? fmtDate(task.finish_date) : "—"}
                        </td>

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

                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              color: st.color,
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
                          {task.is_third_party_assignment && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#7e57c2",
                                background: "#ede7f6",
                                padding: "2px 7px",
                                borderRadius: "8px",
                              }}
                            >
                              TAGGED IN
                            </span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
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
                                        textTransform: "uppercase",
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
                                          boxSizing: "border-box",
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

                                <div>
                                  <TaskUpdateLog
                                    task={task}
                                    status={task.status}
                                    refreshKey={logRefreshKeys[task.id] || 0}
                                    canEdit={canEditUpdate}
                                    readOnly={isDone}
                                    systemUsers={systemUsers}
                                    authHeaders={authHeaders}
                                    onUpdateAdded={() => fetchTasks()}
                                    description={task.job_description}
                                  />
                                </div>
                              </div>

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

export default MyTasksDashboard;

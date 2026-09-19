// ============================================
// My Tasks Dashboard — standalone, reached from a dashboard card
// Save as: client/src/pages/worklist/MyTasksDashboard.tsx
// ============================================

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WorklistTaskDashboard.css";
import AppHeader from "../../components/AppHeader";

interface WorklistTask {
  id: number;
  task_no: number;
  year: number;
  customer_id: number;
  customer_name: string;
  job_type: string;
  job_reference_id: number;
  job_reference_name: string;
  assigned_member: string;
  job_description: string;
  due_date: string;
  status: string;
  finish_date: string;
  created_by: string;
  created_at: string;
  has_third_party?: boolean;
  third_party_names?: string | null;
}

interface SystemUser {
  username: string;
  first_name: string;
  last_name: string;
}

interface User {
  username: string;
  role: string;
}

const JOB_TYPES: Record<
  string,
  { label: string; path: (c: number, r: number) => string }
> = {
  project: {
    label: "Project",
    path: (c, r) => `/customers/${c}/projects/${r}`,
  },
  compressor_service: {
    label: "Compressor Service",
    path: (c, r) => `/customers/${c}/compressor-service/${r}`,
  },
  compressor_repair: {
    label: "Compressor Repair",
    path: (c, r) => `/customers/${c}/compressor-repair/${r}`,
  },
  system_repair: {
    label: "System Repair",
    path: (c) => `/customers/${c}/system-repair`,
  },
  system_inspection: {
    label: "System Inspection",
    path: (c) => `/customers/${c}/system-inspection`,
  },
};

const STATUS_OPTIONS = [
  {
    value: "todo",
    label: "To Do",
    bg: "#e3f2fd",
    color: "#2e7d32",
    dot: "#64b5f6",
  },
  {
    value: "in_progress",
    label: "In Progress",
    bg: "#fff8e1",
    color: "#b28900",
    dot: "#ffca28",
  },
  {
    value: "on_hold",
    label: "On Hold",
    bg: "#fce4ec",
    color: "#880e4f",
    dot: "#ec407a",
  },
  {
    value: "permission",
    label: "Permission",
    bg: "#ede7f6",
    color: "#5e35b1",
    dot: "#7e57c2",
  },
  {
    value: "done",
    label: "Done",
    bg: "#e8f5e9",
    color: "#2e7d32",
    dot: "#66bb6a",
  },
];

const getStatus = (v: string) =>
  STATUS_OPTIONS.find((s) => s.value === v) || STATUS_OPTIONS[0];

const fmtDate = (d: string) => {
  if (!d) return "—";
  const m = d.split("T")[0].match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
};

const fmtLogDateTime = (raw: string) => {
  if (!raw) return { date: "—", time: "—" };
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
  const d = new Date(hasTz ? raw : `${raw.replace(" ", "T")}Z`);
  if (isNaN(d.getTime())) return { date: "—", time: "—" };
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

const isOverdue = (task: WorklistTask) =>
  !!task.due_date &&
  task.status !== "done" &&
  new Date(task.due_date) < new Date(new Date().toDateString());

const API = "https://coolmanworkshop-production.up.railway.app/api";
const CURRENT_YEAR = new Date().getFullYear();

// ── Update Log (same endpoints/behaviour as Job Assigned) ──────────
const TaskUpdateLog = ({
  taskId,
  canEdit,
  readOnly,
  systemUsers,
  authHeaders,
}: {
  taskId: number;
  canEdit: boolean;
  readOnly: boolean;
  systemUsers: SystemUser[];
  authHeaders: () => { Authorization: string };
}) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignOpenFor, setAssignOpenFor] = useState<number | null>(null);

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

  const handleAssignThirdParty = async (updateId: number, username: string) => {
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
    }
  };

  return (
    <div style={{ marginTop: "14px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "#667eea",
          marginBottom: "8px",
        }}
      >
        Update Log
      </div>

      {updates.length === 0 ? (
        <div
          style={{
            fontSize: "13px",
            color: "#bbb",
            fontStyle: "italic",
            padding: "8px 0",
          }}
        >
          No updates yet
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          {updates.map((u) => {
            const st = getStatus(u.status || "todo");
            const { date, time } = fmtLogDateTime(u.created_at);
            return (
              <div
                key={u.id}
                style={{
                  background: "#f8f9ff",
                  border: "1px solid #eef0ff",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ fontSize: "13px", color: "#333", flex: 1 }}>
                    {u.update_note}
                  </div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "9px",
                      fontSize: "10px",
                      fontWeight: 700,
                      background: st.bg,
                      color: st.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {st.label}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "6px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#aaa" }}>
                    {date} · {time} · {u.created_by || "—"}
                  </span>
                  <div style={{ position: "relative" }}>
                    {u.third_party ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#c62828",
                        }}
                      >
                        @{u.third_party}
                      </span>
                    ) : !readOnly ? (
                      <button
                        onClick={() =>
                          setAssignOpenFor(assignOpenFor === u.id ? null : u.id)
                        }
                        style={{
                          background: "none",
                          border: "1px dashed #bbb",
                          borderRadius: "5px",
                          color: "#888",
                          fontSize: "11px",
                          padding: "2px 8px",
                          cursor: "pointer",
                        }}
                      >
                        @ Assign
                      </button>
                    ) : null}
                    {assignOpenFor === u.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          zIndex: 20,
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                          minWidth: "170px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          marginTop: "4px",
                        }}
                      >
                        {systemUsers.map((su) => (
                          <div
                            key={su.username}
                            onClick={() =>
                              handleAssignThirdParty(u.id, su.username)
                            }
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f2f2f2",
                            }}
                          >
                            {su.first_name} {su.last_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEdit && !readOnly ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an update..."
            rows={2}
            style={{
              flex: 1,
              padding: "8px 10px",
              fontSize: "13px",
              border: "1.5px solid #ddd",
              borderRadius: "6px",
              resize: "vertical",
              fontFamily: "inherit",
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
              opacity: !newNote.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "..." : "+ Add"}
          </button>
        </div>
      ) : !readOnly ? (
        <div style={{ fontSize: "12px", color: "#aaa", fontStyle: "italic" }}>
          Move this task to In Progress to start adding updates.
        </div>
      ) : null}
    </div>
  );
};

// ── Task Card ────────────────────────────────────────────────────
const TaskCard = ({
  task,
  isExpanded,
  onToggle,
  onStatusChange,
  onNavigateToJob,
  systemUsers,
  authHeaders,
}: {
  task: WorklistTask;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (task: WorklistTask, status: string) => void;
  onNavigateToJob: (e: React.MouseEvent, task: WorklistTask) => void;
  systemUsers: SystemUser[];
  authHeaders: () => { Authorization: string };
}) => {
  const st = getStatus(task.status);
  const isDone = task.status === "done";
  const canEditUpdate = !isDone && task.status !== "todo";
  const jobType = JOB_TYPES[task.job_type];
  const overdue = isOverdue(task);

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${isExpanded ? "#667eea" : "#eee"}`,
        borderLeft: `4px solid ${st.dot}`,
        borderRadius: "12px",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
        boxShadow: isExpanded
          ? "0 4px 16px rgba(102,126,234,0.15)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        opacity: isDone ? 0.7 : 1,
      }}
      onClick={onToggle}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#667eea" }}
            >
              #{task.task_no}
            </span>
            {task.year !== CURRENT_YEAR && (
              <span style={{ fontSize: "10px", color: "#aaa" }}>
                ({task.year})
              </span>
            )}
            {jobType && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  fontWeight: 600,
                }}
              >
                {jobType.label}
              </span>
            )}
            {overdue && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#f44336",
                  background: "#ffebee",
                  padding: "2px 7px",
                  borderRadius: "8px",
                }}
              >
                OVERDUE
              </span>
            )}
            {task.has_third_party && (
              <span
                title={`Third party: ${task.third_party_names}`}
                style={{ fontSize: "10px", fontWeight: 700, color: "#c62828" }}
              >
                ⚠ 3rd party
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#222",
              marginBottom: "2px",
            }}
          >
            {task.customer_name || "—"}
            {task.job_reference_name ? ` — ${task.job_reference_name}` : ""}
          </div>
          {task.job_description && (
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: isExpanded ? undefined : 2,
                WebkitBoxOrient: "vertical" as const,
              }}
            >
              {task.job_description}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 700,
              background: st.bg,
              color: st.color,
              marginBottom: "6px",
            }}
          >
            {st.label}
          </span>
          <div
            style={{ fontSize: "12px", color: overdue ? "#f44336" : "#999" }}
          >
            Due {fmtDate(task.due_date)}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "6px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#888" }}>
              Assigned by:{" "}
              <strong style={{ color: "#555" }}>
                {task.created_by || "—"}
              </strong>
            </div>
            {task.finish_date && (
              <div style={{ fontSize: "12px", color: "#888" }}>
                Finished:{" "}
                <strong style={{ color: "#555" }}>
                  {fmtDate(task.finish_date)}
                </strong>
              </div>
            )}
          </div>

          {!isDone && (
            <div style={{ marginBottom: "6px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#667eea",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value)}
                style={{
                  display: "block",
                  marginTop: "4px",
                  width: "100%",
                  maxWidth: "260px",
                  padding: "8px 10px",
                  fontSize: "13px",
                  border: "1.5px solid #ddd",
                  borderRadius: "6px",
                  background: st.bg,
                  color: st.color,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {STATUS_OPTIONS.filter(
                  (s) => task.status === "todo" || s.value !== "todo",
                ).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {task.status !== "todo" && (
                <div
                  style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}
                >
                  Can't be moved back to To Do
                </div>
              )}
            </div>
          )}

          <TaskUpdateLog
            taskId={task.id}
            canEdit={canEditUpdate}
            readOnly={isDone}
            systemUsers={systemUsers}
            authHeaders={authHeaders}
          />

          {jobType && (
            <div style={{ marginTop: "14px" }}>
              <button
                onClick={(e) => onNavigateToJob(e, task)}
                style={{
                  padding: "7px 16px",
                  background: "#667eea",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                🔗 Open {jobType.label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────
const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<WorklistTask[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    fetchTasks();
    fetchSystemUsers();
  }, []);

  const fetchTasks = async (retry = 0) => {
    try {
      const res = await axios.get(`${API}/myTasks/tasks/${CURRENT_YEAR}`, {
        headers: authHeaders(),
      });
      setTasks(res.data.tasks || []);
    } catch {
      if (retry < 3) setTimeout(() => fetchTasks(retry + 1), 800);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const res = await axios.get(`${API}/worklist/dropdown/users`, {
        headers: authHeaders(),
      });
      setSystemUsers(res.data.users || []);
    } catch {}
  };

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleStatusChange = async (task: WorklistTask, newStatus: string) => {
    if (task.status === "done") return;
    if (newStatus === "todo" && task.status !== "todo") {
      alert("A task can't be moved back to To Do once it has started.");
      return;
    }
    const updates: Record<string, string> = { status: newStatus };
    if (newStatus === "done" && !task.finish_date)
      updates.finish_date = todayISO();

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

  const handleNavigateToJob = async (
    e: React.MouseEvent,
    task: WorklistTask,
  ) => {
    e.stopPropagation();
    const jt = JOB_TYPES[task.job_type];
    if (!jt || !task.customer_id) return;
    const link = jt.path(task.customer_id, task.job_reference_id ?? 0);
    try {
      const custRes = await axios.get(`${API}/customers/${task.customer_id}`, {
        headers: authHeaders(),
      });
      const customer = custRes.data.customer || {
        id: task.customer_id,
        name: task.customer_name,
      };
      let state: Record<string, any> = { customer };
      if (task.job_type === "project" && task.job_reference_id) {
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

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => !statusFilter || t.status === statusFilter)
      .filter(
        (t) =>
          !search ||
          String(t.task_no).includes(search) ||
          (t.customer_name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (t.job_description || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (t.job_reference_name || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        const aOverdue = isOverdue(a) ? 0 : 1;
        const bOverdue = isOverdue(b) ? 0 : 1;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        const aDone = a.status === "done" ? 1 : 0;
        const bDone = b.status === "done" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.task_no - b.task_no;
      });
  }, [tasks, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      on_hold: 0,
      permission: 0,
      done: 0,
    };
    tasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
    });
    return c;
  }, [tasks]);

  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);
  const activeCount = tasks.length - counts.done;

  return (
    <div className="project-dashboard">
      <AppHeader />

      <div className="project-main-content">
        <div className="project-header-row">
          <div>
            <h2>My Tasks</h2>
            <p style={{ color: "#888", fontSize: "0.9rem", marginTop: "4px" }}>
              {activeCount} active
              {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
            </p>
          </div>
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Summary strip */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() =>
                setStatusFilter(statusFilter === s.value ? null : s.value)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                border:
                  statusFilter === s.value
                    ? `2px solid ${s.dot}`
                    : "1px solid #eee",
                background: statusFilter === s.value ? s.bg : "#fff",
                minWidth: "110px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: s.dot,
                  flexShrink: 0,
                }}
              />
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {counts[s.value] || 0}
                </div>
                <div
                  style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}
                >
                  {s.label}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search your tasks..."
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "10px 16px",
              fontSize: "0.95rem",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
            <h3 style={{ color: "#666" }}>
              {search || statusFilter
                ? "No tasks match"
                : "You're all caught up"}
            </h3>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isExpanded={expandedId === task.id}
                onToggle={() =>
                  setExpandedId(expandedId === task.id ? null : task.id)
                }
                onStatusChange={handleStatusChange}
                onNavigateToJob={handleNavigateToJob}
                systemUsers={systemUsers}
                authHeaders={authHeaders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;

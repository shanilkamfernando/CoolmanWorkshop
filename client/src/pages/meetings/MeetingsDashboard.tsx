// ============================================
// Meetings Dashboard
// Save as: client/src/pages/meetings/MeetingsDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MeetingsDashboard.css";
import companyLogo from "../../assets/mainlogo.jpeg";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Meeting {
  id: number;
  title: string;
  type: "Customer Visit" | "Internal" | "Supplier" | "Follow-up Call";
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  remarks: string;
  customer: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Postponed";
  created_by: string;
  created_at: string;
}

type ViewMode = "calendar" | "list";

const MEETING_COLORS: Record<
  string,
  { bg: string; text: string; light: string }
> = {
  "Customer Visit": { bg: "#1976D2", text: "#fff", light: "#e3f2fd" },
  Internal: { bg: "#7B1FA2", text: "#fff", light: "#f3e5f5" },
  Supplier: { bg: "#F57C00", text: "#fff", light: "#fff3e0" },
  "Follow-up Call": { bg: "#2E7D32", text: "#fff", light: "#e8f5e9" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Scheduled: { bg: "#e3f2fd", text: "#1565c0" },
  Completed: { bg: "#e8f5e9", text: "#2e7d32" },
  Cancelled: { bg: "#ffebee", text: "#c62828" },
  Postponed: { bg: "#fff3e0", text: "#e65100" },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MeetingsDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const emptyForm = {
    title: "",
    type: "Customer Visit" as Meeting["type"],
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
    remarks: "",
    customer: "",
    status: "Scheduled" as Meeting["status"],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchMeetings();
  }, []);

  const formatDateStr = (dateStr: string): string => {
    if (!dateStr) return "—";
    const clean = dateStr.split("T")[0]; // strip time if present
    const [year, month, day] = clean.split("-");
    const monthName = MONTHS[parseInt(month) - 1]?.substring(0, 3) || "";
    return `${day} ${monthName} ${year}`;
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://coolmanworkshop-production.up.railway.app/api/meetings",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error("Error fetching meetings:", err);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      alert("Title and date are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (selectedMeeting) {
        await axios.put(
          `https://coolmanworkshop-production.up.railway.app/api/meetings/${selectedMeeting.id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await axios.post(
          "https://coolmanworkshop-production.up.railway.app/api/meetings",
          form,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
      closeModal();
      fetchMeetings();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Unknown error";
      console.error("Error saving meeting:", err);
      alert(`Failed to save meeting.\n\nServer says: ${detail}`);
    }
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/meetings/${meetingToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setShowDeleteConfirm(false);
      setMeetingToDelete(null);
      closeModal();
      fetchMeetings();
    } catch (err) {
      console.error("Error deleting meeting:", err);
      alert("Failed to delete meeting");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMeeting(null);
    setForm(emptyForm);
  };

  const openAddModal = (date?: string) => {
    setSelectedMeeting(null);
    setForm({ ...emptyForm, date: date || "" });
    setShowModal(true);
  };

  const openEditModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setForm({
      title: meeting.title,
      type: meeting.type,
      date: meeting.date?.split("T")[0] || "",
      start_time: meeting.start_time || "",
      end_time: meeting.end_time || "",
      location: meeting.location || "",
      notes: meeting.notes || "",
      remarks: meeting.remarks || "",
      customer: meeting.customer || "",
      status: meeting.status,
    });
    setShowModal(true);
  };

  // ── formatter helper ──────────────────────────────────────────────────────
  const formatTime = (time: string): string => {
    if (!time) return "";
    const [hourStr, minStr] = time.split(":");
    const hour = parseInt(hourStr);
    const min = minStr || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${min} ${ampm}`;
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getMeetingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return meetings.filter((m) => m.date?.split("T")[0] === dateStr);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredMeetings = meetings
    .filter((m) => {
      const typeOk = filterType === "All" || m.type === filterType;
      const statusOk = filterStatus === "All" || m.status === filterStatus;
      return typeOk && statusOk;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const formatDateTime = (date: string, start_time: string) => {
    if (!date) return "—";
    const dateStr = formatDateStr(date);
    return start_time ? `${dateStr} at ${formatTime(start_time)}` : dateStr;
  };

  return (
    <div className="meetings-dashboard">
      {/* ── Header ── */}
      <div className="meetings-header">
        <div className="header-left" onClick={() => navigate("/dashboard")}>
          <img src={companyLogo} alt="Logo" className="company-logo" />
          <h1 className="header-title">
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="user-chip">👤 {user?.username || "User"}</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="meetings-main">
        <div className="page-title-row">
          <div>
            <h2 className="page-title">Meetings</h2>
            <p className="page-sub">Schedule and track your meetings</p>
          </div>
          <div className="title-actions">
            <button className="btn-back" onClick={() => navigate("/dashboard")}>
              ← Dashboard
            </button>
            <button className="btn-add-meeting" onClick={() => openAddModal()}>
              + Add Meeting
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="legend-row">
          {Object.entries(MEETING_COLORS).map(([type, color]) => (
            <span key={type} className="legend-item">
              <span className="legend-dot" style={{ background: color.bg }} />
              {type}
            </span>
          ))}
        </div>

        {/* View Toggle */}
        <div className="view-toggle-row">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === "calendar" ? "active" : ""}`}
              onClick={() => setViewMode("calendar")}
            >
              📅 Calendar
            </button>
            <button
              className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              ☰ List
            </button>
          </div>
          <span className="total-count">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} total
          </span>
        </div>

        {/* ══ CALENDAR VIEW ══════════════════════════════════════════════════ */}
        {viewMode === "calendar" && (
          <div className="calendar-container">
            <div className="calendar-nav">
              <button className="nav-btn" onClick={prevMonth}>
                ‹
              </button>
              <h3 className="month-title">
                {MONTHS[month]} {year}
              </h3>
              <button className="nav-btn" onClick={nextMonth}>
                ›
              </button>
            </div>

            <div className="calendar-grid">
              {DAYS.map((d) => (
                <div key={d} className="cal-day-header">
                  {d}
                </div>
              ))}

              {calendarDays.map((day, idx) => {
                if (!day)
                  return (
                    <div key={`empty-${idx}`} className="cal-cell empty" />
                  );
                const dayMeetings = getMeetingsForDay(day);
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={day}
                    className={`cal-cell ${isToday ? "today" : ""} ${dayMeetings.length > 0 ? "has-meetings" : ""}`}
                    onClick={() => openAddModal(dateStr)}
                  >
                    <span
                      className={`day-number ${isToday ? "today-dot" : ""}`}
                    >
                      {day}
                    </span>
                    <div className="day-meetings">
                      {dayMeetings.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className="cal-meeting-chip"
                          style={{
                            background: MEETING_COLORS[m.type]?.bg || "#1976D2",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(m);
                          }}
                          title={`${m.title}${m.customer ? ` — ${m.customer}` : ""}`}
                        >
                          {m.start_time && (
                            <span className="chip-time">
                              {formatTime(m.start_time)}
                            </span>
                          )}
                          <span className="chip-title">{m.title}</span>
                          {m.customer && (
                            <span
                              className="chip-customer"
                              style={{
                                fontSize: "10px",
                                opacity: 0.85,
                                display: "block",
                                marginTop: "1px",
                              }}
                            >
                              👤 {m.customer}
                            </span>
                          )}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div className="more-meetings">
                          +{dayMeetings.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="cal-hint">
              💡 Click any date to add a meeting · Click a meeting to edit
            </p>
          </div>
        )}

        {/* ══ LIST VIEW ══════════════════════════════════════════════════════ */}
        {viewMode === "list" && (
          <div className="list-container">
            <div className="list-filters">
              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option>Customer Visit</option>
                <option>Internal</option>
                <option>Supplier</option>
                <option>Follow-up Call</option>
              </select>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Cancelled</option>
                <option>Postponed</option>
              </select>
              <span className="filter-count">
                {filteredMeetings.length} result
                {filteredMeetings.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>
                  No meetings found. Click <strong>+ Add Meeting</strong> to get
                  started.
                </p>
              </div>
            ) : (
              <div className="meeting-list">
                {filteredMeetings.map((m) => {
                  const typeColor =
                    MEETING_COLORS[m.type] || MEETING_COLORS["Customer Visit"];
                  const statusColor =
                    STATUS_COLORS[m.status] || STATUS_COLORS["Scheduled"];
                  return (
                    <div
                      key={m.id}
                      className="meeting-card"
                      onClick={() => openEditModal(m)}
                      style={{ borderLeft: `4px solid ${typeColor.bg}` }}
                    >
                      <div className="meeting-card-top">
                        <div className="meeting-card-left">
                          <span
                            className="meeting-type-tag"
                            style={{
                              background: typeColor.light,
                              color: typeColor.bg,
                            }}
                          >
                            {m.type}
                          </span>
                          <h4 className="meeting-title">{m.title}</h4>
                        </div>
                        <span
                          className="meeting-status-tag"
                          style={{
                            background: statusColor.bg,
                            color: statusColor.text,
                          }}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="meeting-card-meta">
                        <span>
                          🗓 {formatDateTime(m.date, m.start_time)}
                          {m.end_time ? ` – ${m.end_time}` : ""}
                        </span>
                        {m.location && <span>📍 {m.location}</span>}
                      </div>
                      {m.customer && (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            margin: "4px 0 0",
                            fontWeight: 500,
                          }}
                        >
                          👤 {m.customer}
                        </p>
                      )}
                      {m.remarks && (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#777",
                            margin: "4px 0 0",
                            fontStyle: "italic",
                          }}
                        >
                          📝 {m.remarks}
                        </p>
                      )}
                      {m.notes && (
                        <p className="meeting-notes-preview">{m.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ═══════════════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedMeeting ? "Edit Meeting" : "Add New Meeting"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>
                    Meeting Title <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g. Q2 Review with ABC Stores"
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as Meeting["type"],
                      })
                    }
                    className="form-input"
                  >
                    <option>Customer Visit</option>
                    <option>Internal</option>
                    <option>Supplier</option>
                    <option>Follow-up Call</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as Meeting["status"],
                      })
                    }
                    className="form-input"
                  >
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                    <option>Postponed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group full">
                  <label>Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g. Office, Zoom, Client site"
                  />
                </div>

                <div className="form-group full">
                  <label>Customer</label>
                  <input
                    type="text"
                    value={form.customer}
                    onChange={(e) =>
                      setForm({ ...form, customer: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g. ABC Refrigeration Ltd"
                  />
                </div>

                <div className="form-group full">
                  <label>Remarks</label>
                  <textarea
                    value={form.remarks}
                    rows={2}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                    className="form-input"
                    placeholder="Additional remarks..."
                  />
                </div>

                <div className="form-group full">
                  <label>Notes</label>
                  <textarea
                    value={form.notes}
                    rows={3}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="form-input"
                    placeholder="Agenda, outcomes, action items..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedMeeting && (
                <button
                  className="btn-delete-meeting"
                  onClick={() => {
                    setMeetingToDelete(selectedMeeting);
                    setShowDeleteConfirm(true);
                  }}
                >
                  🗑️ Delete
                </button>
              )}
              <div className="footer-right">
                <button className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn-save" onClick={handleSave}>
                  {selectedMeeting ? "Save Changes" : "Add Meeting"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ════════════════════════════════════════════════════ */}
      {showDeleteConfirm && meetingToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-box modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Meeting</h2>
              <button
                className="close-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>"{meetingToDelete.title}"</strong>?
              </p>
              <p className="delete-warn">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <div className="footer-right">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-save"
                  style={{ background: "#c62828" }}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsDashboard;

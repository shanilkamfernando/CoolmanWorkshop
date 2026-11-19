// ============================================
// Meetings Dashboard
// Save as: client/src/pages/meetings/MeetingsDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MeetingsDashboard.css";
import companyLogo from "../../assets/mainlogo.png";

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
const MINI_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const pad2 = (n: number) => String(n).padStart(2, "0");

// Small single-month calendar used inside the 12-month year grid.
const MiniMonthCalendar = ({
  year,
  monthIndex,
  meetings,
  todayStr,
  onDayClick,
}: {
  year: number;
  monthIndex: number;
  meetings: Meeting[];
  todayStr: string;
  onDayClick: (dateStr: string, dayMeetings: Meeting[]) => void;
}) => {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getDayMeetings = (day: number) => {
    const dateStr = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
    return meetings.filter((m) => m.date?.split("T")[0] === dateStr);
  };

  return (
    <div className="mini-month">
      <div className="mini-month-title">{MONTHS[monthIndex]}</div>
      <div className="mini-days-header">
        {MINI_DAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mini-grid">
        {cells.map((day, idx) => {
          if (!day) return <span key={`e-${idx}`} className="mini-empty" />;
          const dateStr = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
          const dayMeetings = getDayMeetings(day);
          const isToday = dateStr === todayStr;
          const primaryColor =
            dayMeetings.length > 0
              ? MEETING_COLORS[dayMeetings[0].type]?.bg || "#1976D2"
              : undefined;
          return (
            <span
              key={day}
              className={`mini-day ${isToday ? "mini-today" : ""} ${dayMeetings.length > 0 ? "mini-has-meeting" : ""}`}
              style={
                dayMeetings.length > 0
                  ? { background: primaryColor, color: "#fff" }
                  : undefined
              }
              onClick={() => onDayClick(dateStr, dayMeetings)}
              title={
                dayMeetings.length > 0
                  ? dayMeetings.map((m) => m.title).join(", ")
                  : "Add meeting"
              }
            >
              {day}
              {dayMeetings.length > 1 && (
                <span className="mini-count">{dayMeetings.length}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

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
  const [dayPopup, setDayPopup] = useState<{
    date: string;
    meetings: Meeting[];
  } | null>(null);

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

  const todayStr = new Date().toISOString().split("T")[0];
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  // ── Filtered list (Year view) ────────────────────────────────────────────
  const filteredMeetings = meetings
    .filter((m) => {
      const typeOk = filterType === "All" || m.type === filterType;
      const statusOk = filterStatus === "All" || m.status === filterStatus;
      return typeOk && statusOk;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Month-wise list (Calendar view, now a list grouped by day) ──────────
  const monthPrefix = `${year}-${pad2(month + 1)}`;
  const monthMeetings = meetings
    .filter((m) => {
      const d = m.date?.split("T")[0];
      if (!d || !d.startsWith(monthPrefix)) return false;
      const typeOk = filterType === "All" || m.type === filterType;
      const statusOk = filterStatus === "All" || m.status === filterStatus;
      return typeOk && statusOk;
    })
    .sort((a, b) => {
      const dCmp = (a.date || "").localeCompare(b.date || "");
      if (dCmp !== 0) return dCmp;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  const groupedByDate: Record<string, Meeting[]> = {};
  monthMeetings.forEach((m) => {
    const d = m.date.split("T")[0];
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(m);
  });
  const sortedDates = Object.keys(groupedByDate).sort();

  const formatGroupDate = (dateStr: string) => {
    const [y, mo, da] = dateStr.split("-").map(Number);
    const dObj = new Date(y, mo - 1, da);
    const weekday = dObj.toLocaleDateString("en-GB", { weekday: "long" });
    return `${weekday}, ${da} ${MONTHS[mo - 1]}`;
  };

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
              🗓️ Year
            </button>
          </div>
          <span className="total-count">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} total
          </span>
        </div>

        {/* ══ CALENDAR VIEW — now a month-wise list grouped by day ═══════════ */}
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

            <div className="month-list-filters">
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
                {monthMeetings.length} meeting
                {monthMeetings.length !== 1 ? "s" : ""} in {MONTHS[month]}
              </span>
            </div>

            {sortedDates.length === 0 ? (
              <div className="empty-state month-empty-state">
                <div className="empty-icon">📅</div>
                <p>
                  No meetings scheduled in {MONTHS[month]} {year}
                </p>
                <button
                  className="btn-add-meeting"
                  style={{ marginTop: "14px" }}
                  onClick={() => openAddModal()}
                >
                  + Add Meeting
                </button>
              </div>
            ) : (
              <div className="month-list">
                {sortedDates.map((dateStr) => {
                  const isToday = dateStr === todayStr;
                  const dayMeetings = groupedByDate[dateStr];
                  return (
                    <div key={dateStr} className="date-group">
                      <div className="date-group-header">
                        <span
                          className={`date-group-title ${isToday ? "is-today" : ""}`}
                        >
                          {formatGroupDate(dateStr)}
                          {isToday && <span className="today-tag">Today</span>}
                        </span>
                        <button
                          className="btn-add-day"
                          onClick={() => openAddModal(dateStr)}
                          title="Add meeting on this day"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="meeting-list">
                        {dayMeetings.map((m) => {
                          const typeColor =
                            MEETING_COLORS[m.type] ||
                            MEETING_COLORS["Customer Visit"];
                          const statusColor =
                            STATUS_COLORS[m.status] || STATUS_COLORS.Scheduled;
                          return (
                            <div
                              key={m.id}
                              className="meeting-card"
                              style={{ borderLeftColor: typeColor.bg }}
                              onClick={() => openEditModal(m)}
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
                                  <span className="meeting-title">
                                    {m.title}
                                  </span>
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
                                {m.start_time && (
                                  <span>
                                    🕒 {formatTime(m.start_time)}
                                    {m.end_time
                                      ? ` – ${formatTime(m.end_time)}`
                                      : ""}
                                  </span>
                                )}
                                {m.location && <span>📍 {m.location}</span>}
                                {m.customer && <span>👤 {m.customer}</span>}
                              </div>
                              {m.notes && (
                                <div className="meeting-notes-preview">
                                  {m.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="cal-hint">
              💡 Click "+ Add" on a day to schedule a meeting · Click a meeting
              to edit
            </p>
          </div>
        )}

        {/* ══ YEAR VIEW ══════════════════════════════════════════════════════ */}
        {viewMode === "list" && (
          <div className="year-container">
            <div className="year-nav">
              <button className="nav-btn" onClick={prevYear}>
                ‹
              </button>
              <h3 className="year-title">{year}</h3>
              <button className="nav-btn" onClick={nextYear}>
                ›
              </button>
            </div>

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
                {
                  filteredMeetings.filter((m) =>
                    m.date?.startsWith(String(year)),
                  ).length
                }{" "}
                meeting{"s"} in {year}
              </span>
            </div>

            <div className="year-grid">
              {Array.from({ length: 12 }).map((_, m) => (
                <MiniMonthCalendar
                  key={m}
                  year={year}
                  monthIndex={m}
                  meetings={filteredMeetings}
                  todayStr={todayStr}
                  onDayClick={(dateStr, dayMeetings) => {
                    if (dayMeetings.length === 0) openAddModal(dateStr);
                    else if (dayMeetings.length === 1)
                      openEditModal(dayMeetings[0]);
                    else setDayPopup({ date: dateStr, meetings: dayMeetings });
                  }}
                />
              ))}
            </div>
            <p className="cal-hint">
              💡 Click an empty date to add a meeting · Click a highlighted date
              to view/edit
            </p>
          </div>
        )}
      </div>

      {/* ══ DAY POPUP (year grid — multiple meetings on one date) ══════════════ */}
      {dayPopup && (
        <div className="modal-overlay" onClick={() => setDayPopup(null)}>
          <div
            className="modal-box modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{formatDateStr(dayPopup.date)}</h2>
              <button className="close-btn" onClick={() => setDayPopup(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="day-popup-list">
                {dayPopup.meetings.map((m) => {
                  const typeColor =
                    MEETING_COLORS[m.type] || MEETING_COLORS["Customer Visit"];
                  return (
                    <div
                      key={m.id}
                      className="day-popup-item"
                      style={{ borderLeft: `4px solid ${typeColor.bg}` }}
                      onClick={() => {
                        setDayPopup(null);
                        openEditModal(m);
                      }}
                    >
                      <strong>{m.title}</strong>
                      {m.start_time && (
                        <span> · {formatTime(m.start_time)}</span>
                      )}
                      {m.customer && (
                        <div className="day-popup-customer">
                          👤 {m.customer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <div className="footer-right">
                <button
                  className="btn-save"
                  onClick={() => {
                    const d = dayPopup.date;
                    setDayPopup(null);
                    openAddModal(d);
                  }}
                >
                  + Add Another Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
